import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rawForecasts = await prisma.revenueForecast.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
    const forecasts = rawForecasts.map(f => ({
      id: f.id,
      period: f.period,
      predictedRevenue: f.predictedAmount,
      actualRevenue: f.actualAmount || 0,
      confidence: f.confidence,
    }));
    const opportunities = await prisma.opportunity.findMany({
      include: { owner: { select: { id: true, name: true } } },
    });

    const wonDeals = opportunities.filter(o => o.stage === 'CLOSED_WON');
    const lostDeals = opportunities.filter(o => o.stage === 'CLOSED_LOST');
    const winRate = wonDeals.length + lostDeals.length > 0
      ? (wonDeals.length / (wonDeals.length + lostDeals.length) * 100).toFixed(1)
      : '0';

    const repMap = opportunities.reduce((acc: any, o) => {
      const repId = o.owner?.id || 'unknown';
      const rep = o.owner?.name || 'Unknown';
      if (!acc[repId]) acc[repId] = { id: repId, name: rep, won: 0, lost: 0, pipelineValue: 0, revenue: 0 };
      if (o.stage === 'CLOSED_WON') { acc[repId].won++; acc[repId].revenue += o.amount; }
      else if (o.stage === 'CLOSED_LOST') { acc[repId].lost++; }
      else { acc[repId].pipelineValue += o.amount; }
      return acc;
    }, {});

    const totalRevenue = wonDeals.reduce((sum, o) => sum + o.amount, 0);

    return NextResponse.json({
      forecasts,
      stats: {
        winRate: parseFloat(winRate as string),
        totalRevenue,
        avgDealSize: wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0,
      },
      repPerformance: Object.values(repMap),
    });
  } catch (error) {
    console.error('Error fetching revenue intelligence:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 });
  }
}
