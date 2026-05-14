import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface QuoteLineItemInput {
  productId: string;
  quantity: number;
  /** Manual override discount percent (0-100) */
  discountPercent?: number;
}

/**
 * POST /api/cpq/quote
 * Calculates a CPQ quote based on products, quantities, and discount rules.
 * Persists the quote linked to an opportunity.
 *
 * Body:
 * {
 *   opportunityId?: string,
 *   accountId: string,
 *   contactId?: string,
 *   expirationDays?: number,   // default 30
 *   name: string,
 *   lineItems: [{ productId, quantity, discountPercent? }]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      opportunityId,
      accountId,
      contactId,
      name,
      expirationDays = 30,
      lineItems,
    } = body as {
      opportunityId?: string;
      accountId: string;
      contactId?: string;
      name: string;
      expirationDays?: number;
      lineItems: QuoteLineItemInput[];
    };

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: 'Quote name is required' }, { status: 400 });
    }
    if (!lineItems?.length) {
      return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 });
    }

    // Fetch products and active pricing rules
    const productIds = lineItems.map((li) => li.productId);
    const [products, pricingRules] = await Promise.all([
      prisma.product.findMany({ where: { id: { in: productIds } } }),
      prisma.productRule.findMany({ where: { isActive: true, ruleType: 'PRICING' } }),
    ]);

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Compute line item totals
    let subtotal = 0;
    const computedLineItems: {
      productId: string;
      productName: string;
      productCode: string | null;
      quantity: number;
      listPrice: number;
      unitPrice: number;
      discount: number;
      totalPrice: number;
      sortOrder: number;
    }[] = [];

    lineItems.forEach((li, idx) => {
      const product = productMap.get(li.productId);
      if (!product) return; // skip unknown products

      const listPrice = product.unitPrice;
      let discountPercent = li.discountPercent ?? 0;

      // Apply matching pricing rules (take the highest discount)
      const applicableRules = pricingRules.filter((rule) => {
        const ids = rule.productIds as string[];
        return ids.length === 0 || ids.includes(product.id);
      });

      for (const rule of applicableRules) {
        if (rule.discountType === 'PERCENTAGE' && rule.discountValue) {
          // Check quantity condition from actions JSON
          const actions = rule.actions as Record<string, any>;
          const minQty = (actions.minQuantity as number) ?? 0;
          if (li.quantity >= minQty && rule.discountValue > discountPercent) {
            discountPercent = rule.discountValue;
          }
        }
      }

      const discountAmount = (listPrice * discountPercent) / 100;
      const unitPrice = listPrice - discountAmount;
      const totalPrice = unitPrice * li.quantity;
      subtotal += totalPrice;

      computedLineItems.push({
        productId: product.id,
        productName: product.name,
        productCode: product.code ?? null,
        quantity: li.quantity,
        listPrice,
        unitPrice,
        discount: discountPercent,
        totalPrice,
        sortOrder: idx,
      });
    });

    const taxRate = 0; // can be configured per client
    const tax = subtotal * taxRate;
    const grandTotal = subtotal + tax;

    const expirationDate = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);

    // Persist quote
    const quote = await prisma.quote.create({
      data: {
        name,
        opportunityId: opportunityId ?? null,
        accountId,
        contactId: contactId ?? null,
        status: 'DRAFT',
        expirationDate,
        subtotal,
        discount: 0,
        discountType: 'AMOUNT',
        tax,
        shippingHandling: 0,
        grandTotal,
        ownerId: session.user.id,
        lineItems: {
          create: computedLineItems,
        },
      },
      include: {
        lineItems: true,
      },
    });

    return NextResponse.json({ quote }, { status: 201 });
  } catch (error: any) {
    console.error('Error calculating CPQ quote:', error);
    return NextResponse.json({ error: 'Failed to calculate quote' }, { status: 500 });
  }
}

/**
 * GET /api/cpq/quote?opportunityId=xxx
 * List quotes for an opportunity.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const opportunityId = searchParams.get('opportunityId');
    const accountId = searchParams.get('accountId');

    const where = {
      ...(opportunityId && { opportunityId }),
      ...(accountId && { accountId }),
    };

    const quotes = await prisma.quote.findMany({
      where,
      include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ quotes });
  } catch (error: any) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
  }
}
