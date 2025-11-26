import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const opportunityId = searchParams.get('opportunityId');
    const accountId = searchParams.get('accountId');

    const where: any = {};
    if (status) where.status = status;
    if (opportunityId) where.opportunityId = opportunityId;
    if (accountId) where.accountId = accountId;

    const quotes = await prisma.quote.findMany({
      where,
      include: {
        lineItems: true,
        _count: { select: { lineItems: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch account names for quotes
    const accountIds = [...new Set(quotes.map(q => q.accountId))];
    const accounts = await prisma.clientCompany.findMany({
      where: { id: { in: accountIds } },
      select: { id: true, name: true },
    });
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    // Add account info to quotes
    const quotesWithAccounts = quotes.map(quote => ({
      ...quote,
      account: accountMap.get(quote.accountId) || null,
    }));

    // Calculate stats
    const stats = {
      totalQuotes: quotesWithAccounts.length,
      draftQuotes: quotesWithAccounts.filter(q => q.status === 'DRAFT').length,
      pendingQuotes: quotesWithAccounts.filter(q => ['NEEDS_REVIEW', 'IN_REVIEW'].includes(q.status)).length,
      approvedQuotes: quotesWithAccounts.filter(q => q.status === 'APPROVED').length,
      acceptedQuotes: quotesWithAccounts.filter(q => q.status === 'ACCEPTED').length,
      totalValue: quotesWithAccounts.reduce((sum, q) => sum + (typeof q.grandTotal === 'number' ? q.grandTotal : 0), 0),
    };

    return NextResponse.json({ quotes: quotesWithAccounts, stats });
  } catch (error: any) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      opportunityId,
      accountId,
      contactId,
      expirationDate,
      description,
      terms,
      lineItems,
      discount,
      discountType,
      tax,
      shippingHandling,
      billingAddress,
      shippingAddress,
    } = body;

    if (!name || !accountId || !expirationDate) {
      return NextResponse.json(
        { error: 'Name, account, and expiration date are required' },
        { status: 400 }
      );
    }

    // Generate quote number
    const quoteCount = await prisma.quote.count();
    const quoteNumber = `Q-${String(quoteCount + 1).padStart(6, '0')}`;

    // Calculate totals
    let subtotal = 0;
    if (lineItems && lineItems.length > 0) {
      subtotal = lineItems.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0);
    }

    const discountAmount = discountType === 'PERCENT' ? (subtotal * (discount || 0)) / 100 : (discount || 0);
    const grandTotal = subtotal - discountAmount + (tax || 0) + (shippingHandling || 0);

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        name,
        opportunityId,
        accountId,
        contactId,
        expirationDate: new Date(expirationDate),
        description,
        terms,
        subtotal,
        discount: discount || 0,
        discountType: discountType || 'AMOUNT',
        tax: tax || 0,
        shippingHandling: shippingHandling || 0,
        grandTotal,
        ownerId: session.user.id,
        billingName: billingAddress?.name,
        billingStreet: billingAddress?.street,
        billingCity: billingAddress?.city,
        billingState: billingAddress?.state,
        billingPostalCode: billingAddress?.postalCode,
        billingCountry: billingAddress?.country,
        shippingName: shippingAddress?.name,
        shippingStreet: shippingAddress?.street,
        shippingCity: shippingAddress?.city,
        shippingState: shippingAddress?.state,
        shippingPostalCode: shippingAddress?.postalCode,
        shippingCountry: shippingAddress?.country,
        lineItems: lineItems
          ? {
              create: lineItems.map((item: any, index: number) => ({
                productId: item.productId,
                productName: item.productName,
                productCode: item.productCode,
                quantity: item.quantity || 1,
                listPrice: item.listPrice,
                unitPrice: item.unitPrice,
                discount: item.discount || 0,
                totalPrice: item.totalPrice,
                sortOrder: index,
                description: item.description,
              })),
            }
          : undefined,
      },
      include: {
        lineItems: true,
      },
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error: any) {
    console.error('Error creating quote:', error);
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 });
  }
}
