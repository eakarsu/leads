import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { predictOpportunityClose } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { opportunityId } = await request.json();

    if (!opportunityId) {
      return NextResponse.json({ error: 'opportunityId is required' }, { status: 400 });
    }

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: {
        client: true,
        owner: true,
      },
    });

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    // Call AI to predict opportunity outcome
    const prediction = await predictOpportunityClose(opportunity);

    // Store prediction in database
    await prisma.aIPrediction.create({
      data: {
        predictionType: 'OPPORTUNITY_FORECAST',
        objectType: 'Opportunity',
        objectId: opportunityId,
        prediction: {
          predictedCloseDate: prediction.predictedCloseDate,
          predictedAmount: prediction.predictedAmount,
          winProbability: prediction.winProbability,
        },
        confidence: prediction.confidence,
        reasoning: prediction.reasoning,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return NextResponse.json(prediction);
  } catch (error: any) {
    console.error('Error forecasting opportunity:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
