import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List invoices
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const status = searchParams.get('status');
    const orderId = searchParams.get('orderId');

    const whereClause: any = {};

    if (accountId) {
      whereClause.accountId = accountId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (orderId) {
      whereClause.orderId = orderId;
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        lineItems: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch account names for invoices
    const accountIds = [...new Set(invoices.map(i => i.accountId))];
    const accounts = await prisma.clientCompany.findMany({
      where: { id: { in: accountIds } },
      select: { id: true, name: true },
    });
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    // Add account info to invoices
    const invoicesWithAccounts = invoices.map(invoice => ({
      ...invoice,
      account: accountMap.get(invoice.accountId) || null,
    }));

    // Calculate stats
    const stats = {
      totalInvoices: invoicesWithAccounts.length,
      draftInvoices: invoicesWithAccounts.filter(i => i.status === 'DRAFT').length,
      sentInvoices: invoicesWithAccounts.filter(i => i.status === 'SENT').length,
      paidInvoices: invoicesWithAccounts.filter(i => i.status === 'PAID').length,
      overdueInvoices: invoicesWithAccounts.filter(i => i.status === 'OVERDUE').length,
      totalAmount: invoicesWithAccounts.reduce((sum, i) => sum + (typeof i.totalAmount === 'number' ? i.totalAmount : 0), 0),
      totalPaid: invoicesWithAccounts.reduce((sum, i) => sum + (typeof i.amountPaid === 'number' ? i.amountPaid : 0), 0),
      totalOutstanding: invoicesWithAccounts.reduce((sum, i) => sum + ((typeof i.totalAmount === 'number' ? i.totalAmount : 0) - (typeof i.amountPaid === 'number' ? i.amountPaid : 0)), 0),
    };

    return NextResponse.json({ invoices: invoicesWithAccounts, stats });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      accountId,
      contactId,
      orderId,
      invoiceDate,
      dueDate,
      status,
      description,
      billingStreet,
      billingCity,
      billingState,
      billingPostalCode,
      billingCountry,
      taxRate,
      lineItems,
    } = body;

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count();
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`;

    // Calculate totals
    let subtotal = 0;
    if (lineItems) {
      for (const item of lineItems) {
        subtotal += (item.unitPrice || 0) * (item.quantity || 1);
      }
    }

    const taxAmount = subtotal * ((taxRate || 0) / 100);
    const totalAmount = subtotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        accountId,
        contactId,
        orderId,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        status: status || 'DRAFT',
        description,
        billingStreet,
        billingCity,
        billingState,
        billingPostalCode,
        billingCountry,
        subtotal,
        tax: taxAmount,
        totalAmount,
        balance: totalAmount,
        amountPaid: 0,
        ownerId: session.user.id,
      },
    });

    // Create line items
    if (lineItems && lineItems.length > 0) {
      for (const item of lineItems) {
        await prisma.invoiceLineItem.create({
          data: {
            invoiceId: invoice.id,
            productId: item.productId,
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            totalPrice: (item.unitPrice || 0) * (item.quantity || 1),
          },
        });
      }
    }

    const createdInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        lineItems: true,
      },
    });

    return NextResponse.json(createdInvoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update an invoice or record payment
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      status,
      description,
      dueDate,
      taxRate,
      lineItems,
      payment, // For recording payments
    } = body;

    // Record payment if provided
    if (payment) {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
      });

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      await prisma.payment.create({
        data: {
          invoiceId: id,
          amount: payment.amount,
          paymentDate: payment.paymentDate ? new Date(payment.paymentDate) : new Date(),
          paymentMethod: payment.paymentMethod,
          reference: payment.referenceNumber,
          notes: payment.notes,
        },
      });

      const newAmountPaid = (invoice.amountPaid || 0) + payment.amount;
      const totalAmount = invoice.totalAmount || 0;

      await prisma.invoice.update({
        where: { id },
        data: {
          amountPaid: newAmountPaid,
          balance: totalAmount - newAmountPaid,
          status: newAmountPaid >= totalAmount ? 'PAID' : 'PARTIALLY_PAID',
          paidAt: newAmountPaid >= totalAmount ? new Date() : undefined,
        },
      });

      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          payments: true,
        },
      });

      return NextResponse.json(updatedInvoice);
    }

    // Update line items if provided
    if (lineItems) {
      // Remove existing line items
      await prisma.invoiceLineItem.deleteMany({
        where: { invoiceId: id },
      });

      // Add new line items and calculate totals
      let subtotal = 0;
      for (const item of lineItems) {
        const totalPrice = (item.unitPrice || 0) * (item.quantity || 1);
        subtotal += totalPrice;
        await prisma.invoiceLineItem.create({
          data: {
            invoiceId: id,
            productId: item.productId,
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            totalPrice,
          },
        });
      }

      const taxAmount = subtotal * ((taxRate || 0) / 100);
      const totalAmount = subtotal + taxAmount;

      await prisma.invoice.update({
        where: { id },
        data: {
          subtotal,
          tax: taxAmount,
          totalAmount,
          balance: totalAmount,
        },
      });
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
      include: {
        lineItems: true,
        payments: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete an invoice
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
    }

    // Delete related records first
    await prisma.payment.deleteMany({ where: { invoiceId: id } });
    await prisma.invoiceLineItem.deleteMany({ where: { invoiceId: id } });
    await prisma.invoice.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
