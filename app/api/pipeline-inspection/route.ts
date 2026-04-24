import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const opportunities = await prisma.opportunity.findMany({
      include: { client: { select: { id: true, name: true } }, owner: { select: { id: true, name: true } } },
    });

    const byStage = opportunities.reduce((acc: any, o) => {
      acc[o.stage] = acc[o.stage] || { count: 0, value: 0 };
      acc[o.stage].count++;
      acc[o.stage].value += o.amount;
      return acc;
    }, {});

    const totalPipeline = opportunities.reduce((sum, o) => sum + o.amount, 0);
    const weightedPipeline = opportunities.reduce((sum, o) => sum + (o.amount * o.probability / 100), 0);
    const avgDealSize = opportunities.length > 0 ? totalPipeline / opportunities.length : 0;

    const stuckDeals = opportunities.filter(o => {
      const daysSinceUpdate = (Date.now() - new Date(o.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate > 14 && !['CLOSED_WON', 'CLOSED_LOST'].includes(o.stage);
    });

    const closingSoon = opportunities.filter(o => {
      if (!o.expectedCloseDate) return false;
      const daysUntilClose = (new Date(o.expectedCloseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysUntilClose <= 30 && daysUntilClose > 0 && !['CLOSED_WON', 'CLOSED_LOST'].includes(o.stage);
    });

    const stageData = Object.entries(byStage).map(([stage, data]: [string, any]) => ({
      stage,
      count: data.count,
      value: data.value,
    }));

    const mapDeal = (o: any) => ({
      id: o.id,
      name: o.name,
      stage: o.stage,
      amount: o.amount,
      closeDate: o.expectedCloseDate,
      daysSinceUpdate: Math.floor((Date.now() - new Date(o.updatedAt).getTime()) / (1000 * 60 * 60 * 24)),
      owner: o.owner?.name || 'Unknown',
      probability: o.probability,
    });

    return NextResponse.json({
      stats: {
        totalPipeline, weightedPipeline, avgDealSize,
        dealCount: opportunities.length,
        stuckDeals: stuckDeals.length,
        closingSoon: closingSoon.length,
      },
      stageData,
      stuckDeals: stuckDeals.slice(0, 10).map(mapDeal),
      closingSoonDeals: closingSoon.slice(0, 10).map(mapDeal),
    });
  } catch (error) {
    console.error('Error fetching pipeline inspection:', error);
    return NextResponse.json({ error: 'Failed to fetch pipeline data' }, { status: 500 });
  }
}
