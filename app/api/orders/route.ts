import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parsePaginationParams, buildPrismaQuery, buildPaginatedResponse } from '@/lib/pagination';

// GET - List orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paginationParams = parsePaginationParams(request);

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const status = searchParams.get('status');
    const contractId = searchParams.get('contractId');

    const whereClause: any = {};

    if (accountId) {
      whereClause.accountId = accountId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (contractId) {
      whereClause.contractId = contractId;
    }

    const total = await prisma.order.count({ where: whereClause });

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        lineItems: true,
        _count: {
          select: { lineItems: true },
        },
      },
      ...buildPrismaQuery(paginationParams),
    });

    // Fetch account names for orders
    const accountIds = [...new Set(orders.map(o => o.accountId))];
    const accounts = await prisma.clientCompany.findMany({
      where: { id: { in: accountIds } },
      select: { id: true, name: true },
    });
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    // Add account info to orders
    const ordersWithAccounts = orders.map(order => ({
      ...order,
      account: accountMap.get(order.accountId) || null,
    }));

    // Calculate stats
    const stats = {
      totalOrders: ordersWithAccounts.length,
      draftOrders: ordersWithAccounts.filter(o => o.status === 'DRAFT').length,
      activatedOrders: ordersWithAccounts.filter(o => o.status === 'ACTIVATED').length,
      totalValue: ordersWithAccounts.reduce((sum, o) => sum + (typeof o.totalAmount === 'number' ? o.totalAmount : 0), 0),
    };

    return NextResponse.json(buildPaginatedResponse(ordersWithAccounts, total, paginationParams));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      accountId,
      contractId,
      quoteId,
      effectiveDate,
      endDate,
      status,
      description,
      billingStreet,
      billingCity,
      billingState,
      billingPostalCode,
      billingCountry,
      shippingStreet,
      shippingCity,
      shippingState,
      shippingPostalCode,
      shippingCountry,
      lineItems,
    } = body;

    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `ORD-${String(orderCount + 1).padStart(6, '0')}`;

    // Calculate totals
    let subtotal = 0;
    if (lineItems) {
      for (const item of lineItems) {
        subtotal += (item.unitPrice || 0) * (item.quantity || 1);
      }
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        accountId,
        contractId,
        quoteId,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'DRAFT',
        description,
        billingStreet,
        billingCity,
        billingState,
        billingPostalCode,
        billingCountry,
        shippingStreet,
        shippingCity,
        shippingState,
        shippingPostalCode,
        shippingCountry,
        totalAmount: subtotal,
        ownerId: session.user.id,
      },
    });

    // Create line items
    if (lineItems && lineItems.length > 0) {
      for (const item of lineItems) {
        await prisma.orderLineItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            productName: item.productName || 'Product',
            productCode: item.productCode,
            quantity: item.quantity || 1,
            listPrice: item.listPrice || item.unitPrice || 0,
            unitPrice: item.unitPrice || 0,
            discount: item.discount || 0,
            totalPrice: (item.unitPrice || 0) * (item.quantity || 1),
            description: item.description,
          },
        });
      }
    }

    const createdOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        lineItems: true,
      },
    });

    // Fetch account data separately
    let account = null;
    if (createdOrder?.accountId) {
      account = await prisma.clientCompany.findUnique({
        where: { id: createdOrder.accountId },
        select: { id: true, name: true },
      });
    }

    return NextResponse.json({ ...createdOrder, account }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update an order
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
      effectiveDate,
      endDate,
      billingStreet,
      billingCity,
      billingState,
      billingPostalCode,
      billingCountry,
      shippingStreet,
      shippingCity,
      shippingState,
      shippingPostalCode,
      shippingCountry,
      lineItems,
    } = body;

    // Update line items if provided
    if (lineItems) {
      // Remove existing line items
      await prisma.orderLineItem.deleteMany({
        where: { orderId: id },
      });

      // Add new line items
      let subtotal = 0;
      for (const item of lineItems) {
        const totalPrice = (item.unitPrice || 0) * (item.quantity || 1);
        subtotal += totalPrice;
        await prisma.orderLineItem.create({
          data: {
            orderId: id,
            productId: item.productId,
            productName: item.productName || 'Product',
            productCode: item.productCode,
            quantity: item.quantity || 1,
            listPrice: item.listPrice || item.unitPrice || 0,
            unitPrice: item.unitPrice || 0,
            discount: item.discount || 0,
            totalPrice,
            description: item.description,
          },
        });
      }

      // Update order total
      await prisma.order.update({
        where: { id },
        data: { totalAmount: subtotal },
      });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        description,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        billingStreet,
        billingCity,
        billingState,
        billingPostalCode,
        billingCountry,
        shippingStreet,
        shippingCity,
        shippingState,
        shippingPostalCode,
        shippingCountry,
        activatedDate: status === 'ACTIVATED' ? new Date() : undefined,
      },
      include: {
        lineItems: true,
      },
    });

    // Fetch account data separately
    let account = null;
    if (order.accountId) {
      account = await prisma.clientCompany.findUnique({
        where: { id: order.accountId },
        select: { id: true, name: true },
      });
    }

    return NextResponse.json({ ...order, account });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete an order
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    // Delete line items first
    await prisma.orderLineItem.deleteMany({
      where: { orderId: id },
    });

    // Delete order
    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
