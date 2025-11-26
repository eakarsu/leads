import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const bundles = await prisma.productBundle.findMany({
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rules = await prisma.productRule.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    const questions = await prisma.guidedSellingQuestion.findMany({
      orderBy: { questionOrder: 'asc' },
    });

    const stats = {
      totalBundles: bundles.length,
      activeBundles: bundles.filter((b) => b.isActive).length,
      totalRules: rules.length,
      activeRules: rules.filter((r) => r.isActive).length,
      totalQuestions: questions.length,
    };

    return NextResponse.json({ bundles, rules, questions, stats });
  } catch (error) {
    console.error('Error fetching CPQ data:', error);
    return NextResponse.json({ error: 'Failed to fetch CPQ data' }, { status: 500 });
  }
}
