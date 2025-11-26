import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { predictOpportunityClose } from '@/lib/openrouter';

async function handleOpportunityScore(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check for internal workflow header OR regular session auth
    const isInternalWorkflow = request.headers.get('x-workflow-internal') === 'true';
    const session = await getServerSession(authOptions);

    if (!isInternalWorkflow && !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Check if we have a recent prediction cached
    const existingPrediction = await prisma.aIPrediction.findFirst({
      where: {
        objectType: 'Opportunity',
        objectId: id,
        predictionType: 'WIN_PROBABILITY',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPrediction) {
      return NextResponse.json(existingPrediction);
    }

    // Fetch opportunity data
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        client: true,
        owner: true,
        contact: true,
        lead: true,
      },
    });

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    // Generate AI prediction
    const prediction = await predictOpportunityClose(opportunity);

    // Store prediction
    const aiPrediction = await prisma.aIPrediction.create({
      data: {
        objectType: 'Opportunity',
        objectId: id,
        predictionType: 'WIN_PROBABILITY',
        prediction: {
          winProbability: prediction.winProbability,
          predictedCloseDate: prediction.predictedCloseDate,
          predictedAmount: prediction.predictedAmount,
        },
        confidence: prediction.confidence,
        reasoning: prediction.reasoning,
      },
    });

    return NextResponse.json(aiPrediction);
  } catch (error: any) {
    console.error('Error generating opportunity score:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleOpportunityScore(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleOpportunityScore(request, context);
}
