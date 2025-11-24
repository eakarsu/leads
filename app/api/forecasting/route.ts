import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OpportunityStage } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const ownerId = searchParams.get('ownerId');

    // Get current date boundaries
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startOfFollowingMonth = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    const startOfThisQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const startOfNextQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 1);

    // Fetch all open opportunities
    const openOpportunities = await prisma.opportunity.findMany({
      where: {
        ...(clientId && { clientId }),
        ...(ownerId && { ownerId }),
        stage: {
          notIn: ['CLOSED_WON', 'CLOSED_LOST'],
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Fetch closed opportunities for win rate calculation
    const closedOpportunities = await prisma.opportunity.findMany({
      where: {
        ...(clientId && { clientId }),
        ...(ownerId && { ownerId }),
        stage: {
          in: ['CLOSED_WON', 'CLOSED_LOST'],
        },
      },
      select: {
        stage: true,
        amount: true,
      },
    });

    // Calculate total pipeline value
    const totalPipelineValue = openOpportunities.reduce(
      (sum, opp) => sum + opp.amount,
      0
    );

    // Calculate weighted pipeline (amount * probability / 100)
    const weightedPipeline = openOpportunities.reduce(
      (sum, opp) => sum + (opp.amount * opp.probability) / 100,
      0
    );

    // Group by stage
    const byStage: Record<string, { count: number; value: number; weighted: number }> = {};
    openOpportunities.forEach((opp) => {
      if (!byStage[opp.stage]) {
        byStage[opp.stage] = { count: 0, value: 0, weighted: 0 };
      }
      byStage[opp.stage].count++;
      byStage[opp.stage].value += opp.amount;
      byStage[opp.stage].weighted += (opp.amount * opp.probability) / 100;
    });

    // Group by owner
    const byOwner: Record<string, {
      ownerId: string;
      ownerName: string;
      count: number;
      value: number;
      weighted: number;
    }> = {};
    openOpportunities.forEach((opp) => {
      if (!byOwner[opp.ownerId]) {
        byOwner[opp.ownerId] = {
          ownerId: opp.ownerId,
          ownerName: opp.owner.name || opp.owner.email,
          count: 0,
          value: 0,
          weighted: 0,
        };
      }
      byOwner[opp.ownerId].count++;
      byOwner[opp.ownerId].value += opp.amount;
      byOwner[opp.ownerId].weighted += (opp.amount * opp.probability) / 100;
    });

    // Group by expected close date
    const byCloseDatePeriod = {
      thisMonth: { count: 0, value: 0, weighted: 0 },
      nextMonth: { count: 0, value: 0, weighted: 0 },
      thisQuarter: { count: 0, value: 0, weighted: 0 },
      later: { count: 0, value: 0, weighted: 0 },
      unscheduled: { count: 0, value: 0, weighted: 0 },
    };

    openOpportunities.forEach((opp) => {
      const weighted = (opp.amount * opp.probability) / 100;

      if (!opp.expectedCloseDate) {
        byCloseDatePeriod.unscheduled.count++;
        byCloseDatePeriod.unscheduled.value += opp.amount;
        byCloseDatePeriod.unscheduled.weighted += weighted;
      } else {
        const closeDate = new Date(opp.expectedCloseDate);

        if (closeDate >= startOfThisMonth && closeDate < startOfNextMonth) {
          byCloseDatePeriod.thisMonth.count++;
          byCloseDatePeriod.thisMonth.value += opp.amount;
          byCloseDatePeriod.thisMonth.weighted += weighted;
        } else if (closeDate >= startOfNextMonth && closeDate < startOfFollowingMonth) {
          byCloseDatePeriod.nextMonth.count++;
          byCloseDatePeriod.nextMonth.value += opp.amount;
          byCloseDatePeriod.nextMonth.weighted += weighted;
        } else if (closeDate >= startOfThisQuarter && closeDate < startOfNextQuarter) {
          byCloseDatePeriod.thisQuarter.count++;
          byCloseDatePeriod.thisQuarter.value += opp.amount;
          byCloseDatePeriod.thisQuarter.weighted += weighted;
        } else {
          byCloseDatePeriod.later.count++;
          byCloseDatePeriod.later.value += opp.amount;
          byCloseDatePeriod.later.weighted += weighted;
        }
      }
    });

    // Calculate win rate
    const totalClosed = closedOpportunities.length;
    const totalWon = closedOpportunities.filter(
      (opp) => opp.stage === 'CLOSED_WON'
    ).length;
    const winRate = totalClosed > 0 ? (totalWon / totalClosed) * 100 : 0;

    // Calculate average deal size for closed won
    const wonOpportunities = closedOpportunities.filter(
      (opp) => opp.stage === 'CLOSED_WON'
    );
    const averageDealSize = wonOpportunities.length > 0
      ? wonOpportunities.reduce((sum, opp) => sum + opp.amount, 0) / wonOpportunities.length
      : 0;

    const forecast = {
      summary: {
        totalPipelineValue,
        weightedPipeline,
        openOpportunities: openOpportunities.length,
        closedOpportunities: totalClosed,
        wonOpportunities: totalWon,
        winRate,
        averageDealSize,
      },
      byStage: Object.entries(byStage).map(([stage, data]) => ({
        stage,
        ...data,
      })),
      byOwner: Object.values(byOwner),
      byCloseDatePeriod,
    };

    return NextResponse.json(forecast);
  } catch (error: any) {
    console.error('Error calculating forecast:', error);
    return NextResponse.json(
      { error: 'Failed to calculate forecast' },
      { status: 500 }
    );
  }
}
