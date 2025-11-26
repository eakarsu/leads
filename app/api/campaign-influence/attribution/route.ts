import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Attribution models for revenue credit
type AttributionModel = 'FIRST_TOUCH' | 'LAST_TOUCH' | 'LINEAR' | 'TIME_DECAY' | 'U_SHAPED' | 'W_SHAPED';

// Calculate attribution for an opportunity
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { opportunityId, model } = body;

    if (!opportunityId || !model) {
      return NextResponse.json(
        { error: 'Opportunity ID and attribution model are required' },
        { status: 400 }
      );
    }

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
    });

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    // Get all campaign influences for this opportunity, ordered by date
    const influences = await prisma.campaignInfluence.findMany({
      where: { opportunityId },
      orderBy: { createdAt: 'asc' },
    });

    if (influences.length === 0) {
      return NextResponse.json(
        { error: 'No campaign influences found for this opportunity' },
        { status: 400 }
      );
    }

    // Calculate attribution percentages based on model
    const attributions = calculateAttribution(influences, model as AttributionModel, opportunity.amount || 0);

    // Update influence records with new percentages
    for (const attribution of attributions) {
      await prisma.campaignInfluence.update({
        where: { id: attribution.influenceId },
        data: {
          influencePercent: attribution.percent,
          revenueShare: attribution.revenue,
        },
      });
    }

    // Return updated influences
    const updatedInfluences = await prisma.campaignInfluence.findMany({
      where: { opportunityId },
      orderBy: { influencePercent: 'desc' },
    });

    // Fetch campaign names separately
    const campaignIds = [...new Set(updatedInfluences.map(i => i.campaignId))];
    const campaigns = await prisma.campaign.findMany({
      where: { id: { in: campaignIds } },
      select: { id: true, name: true },
    });
    const campaignMap = new Map(campaigns.map(c => [c.id, c]));

    const influencesWithCampaigns = updatedInfluences.map(inf => ({
      ...inf,
      campaign: campaignMap.get(inf.campaignId),
    }));

    return NextResponse.json({
      model,
      totalAmount: opportunity.amount,
      attributions: influencesWithCampaigns,
    });
  } catch (error: any) {
    console.error('Error calculating attribution:', error);
    return NextResponse.json({ error: 'Failed to calculate attribution' }, { status: 500 });
  }
}

function calculateAttribution(
  influences: any[],
  model: AttributionModel,
  totalAmount: number
): { influenceId: string; percent: number; revenue: number }[] {
  const count = influences.length;

  switch (model) {
    case 'FIRST_TOUCH':
      // 100% to first touchpoint
      return influences.map((inf, idx) => ({
        influenceId: inf.id,
        percent: idx === 0 ? 100 : 0,
        revenue: idx === 0 ? totalAmount : 0,
      }));

    case 'LAST_TOUCH':
      // 100% to last touchpoint
      return influences.map((inf, idx) => ({
        influenceId: inf.id,
        percent: idx === count - 1 ? 100 : 0,
        revenue: idx === count - 1 ? totalAmount : 0,
      }));

    case 'LINEAR':
      // Equal distribution
      const linearPercent = 100 / count;
      const linearRevenue = totalAmount / count;
      return influences.map((inf) => ({
        influenceId: inf.id,
        percent: linearPercent,
        revenue: linearRevenue,
      }));

    case 'TIME_DECAY':
      // More recent touchpoints get more credit (exponential decay)
      const decayFactor = 0.5;
      let totalWeight = 0;
      const weights = influences.map((_, idx) => {
        const weight = Math.pow(1 + decayFactor, idx);
        totalWeight += weight;
        return weight;
      });
      return influences.map((inf, idx) => {
        const percent = (weights[idx] / totalWeight) * 100;
        return {
          influenceId: inf.id,
          percent,
          revenue: (percent / 100) * totalAmount,
        };
      });

    case 'U_SHAPED':
      // 40% first, 40% last, 20% split among middle
      if (count === 1) {
        return [{ influenceId: influences[0].id, percent: 100, revenue: totalAmount }];
      }
      if (count === 2) {
        return influences.map((inf) => ({
          influenceId: inf.id,
          percent: 50,
          revenue: totalAmount / 2,
        }));
      }
      const middlePercent = 20 / (count - 2);
      const middleRevenue = (totalAmount * 0.2) / (count - 2);
      return influences.map((inf, idx) => {
        if (idx === 0 || idx === count - 1) {
          return { influenceId: inf.id, percent: 40, revenue: totalAmount * 0.4 };
        }
        return { influenceId: inf.id, percent: middlePercent, revenue: middleRevenue };
      });

    case 'W_SHAPED':
      // 30% first, 30% middle (lead creation), 30% last, 10% split among rest
      if (count <= 3) {
        const percent = 100 / count;
        return influences.map((inf) => ({
          influenceId: inf.id,
          percent,
          revenue: totalAmount / count,
        }));
      }
      const middleIdx = Math.floor(count / 2);
      const restPercent = 10 / (count - 3);
      const restRevenue = (totalAmount * 0.1) / (count - 3);
      return influences.map((inf, idx) => {
        if (idx === 0 || idx === count - 1 || idx === middleIdx) {
          return { influenceId: inf.id, percent: 30, revenue: totalAmount * 0.3 };
        }
        return { influenceId: inf.id, percent: restPercent, revenue: restRevenue };
      });

    default:
      // Default to linear
      const defaultPercent = 100 / count;
      const defaultRevenue = totalAmount / count;
      return influences.map((inf) => ({
        influenceId: inf.id,
        percent: defaultPercent,
        revenue: defaultRevenue,
      }));
  }
}

// Get attribution summary for a campaign
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get all influences for this campaign
    const influences = await prisma.campaignInfluence.findMany({
      where: { campaignId },
    });

    // Fetch opportunities separately
    const opportunityIds = [...new Set(influences.map(i => i.opportunityId))];
    const opportunities = await prisma.opportunity.findMany({
      where: { id: { in: opportunityIds } },
      select: { id: true, name: true, amount: true, stage: true, closedDate: true },
    });
    const opportunityMap = new Map(opportunities.map(o => [o.id, o]));

    // Calculate summary metrics
    const totalOpportunities = influences.length;
    const totalRevenueInfluenced = influences.reduce(
      (sum, inf) => sum + (opportunityMap.get(inf.opportunityId)?.amount || 0),
      0
    );
    const attributedRevenue = influences.reduce((sum, inf) => sum + (inf.revenueShare || 0), 0);
    const primaryInfluences = influences.filter((inf) => inf.isPrimary).length;

    // Group by opportunity stage
    const byStage: Record<string, { count: number; value: number }> = {};
    for (const inf of influences) {
      const opp = opportunityMap.get(inf.opportunityId);
      const stage = opp?.stage || 'Unknown';
      if (!byStage[stage]) {
        byStage[stage] = { count: 0, value: 0 };
      }
      byStage[stage].count++;
      byStage[stage].value += opp?.amount || 0;
    }

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        channel: campaign.channel,
        status: campaign.status,
      },
      summary: {
        totalOpportunities,
        totalRevenueInfluenced,
        attributedRevenue,
        primaryInfluences,
        averageInfluencePercent:
          totalOpportunities > 0
            ? influences.reduce((sum, inf) => sum + inf.influencePercent, 0) / totalOpportunities
            : 0,
      },
      byStage,
      opportunities: influences.map((inf) => {
        const opp = opportunityMap.get(inf.opportunityId);
        return {
          id: opp?.id,
          name: opp?.name,
          amount: opp?.amount,
          stage: opp?.stage,
          closedDate: opp?.closedDate,
          influencePercent: inf.influencePercent,
          revenueShare: inf.revenueShare,
          isPrimary: inf.isPrimary,
        };
      }),
    });
  } catch (error: any) {
    console.error('Error fetching attribution summary:', error);
    return NextResponse.json({ error: 'Failed to fetch attribution' }, { status: 500 });
  }
}
