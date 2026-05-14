import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/cpq/products
 * Returns all active products with pricing tiers (volume discounts) derived
 * from active ProductRules of type PRICING.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const category = searchParams.get('category');

    const where = {
      isActive: true,
      ...(clientId && { clientId }),
      ...(category && { category }),
    };

    const [products, pricingRules] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          client: { select: { id: true, name: true } },
          _count: { select: { lineItems: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.productRule.findMany({
        where: { isActive: true, ruleType: 'PRICING' },
        orderBy: { priority: 'desc' },
      }),
    ]);

    // Attach relevant pricing tiers to each product
    const productsWithTiers = products.map((product) => {
      const applicableRules = pricingRules.filter((rule) => {
        const ids = rule.productIds as string[];
        return ids.length === 0 || ids.includes(product.id);
      });

      const pricingTiers = applicableRules.map((rule) => ({
        ruleId: rule.id,
        name: rule.name,
        description: rule.description,
        discountType: rule.discountType, // PERCENTAGE | FIXED | TIERED
        discountValue: rule.discountValue,
        conditions: rule.conditions,
        actions: rule.actions,
      }));

      return { ...product, pricingTiers };
    });

    return NextResponse.json({
      products: productsWithTiers,
      total: productsWithTiers.length,
    });
  } catch (error: any) {
    console.error('Error fetching CPQ products:', error);
    return NextResponse.json({ error: 'Failed to fetch CPQ products' }, { status: 500 });
  }
}
