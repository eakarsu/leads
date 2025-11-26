import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { predictLeadScore } from '@/lib/openrouter';

export async function GET(
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
        objectType: 'Lead',
        objectId: id,
        predictionType: 'LEAD_SCORE',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPrediction) {
      return NextResponse.json(existingPrediction);
    }

    // Fetch lead data
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        campaign: true,
        client: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Generate AI prediction
    const prediction = await predictLeadScore(lead);

    // Store prediction
    const aiPrediction = await prisma.aIPrediction.create({
      data: {
        objectType: 'Lead',
        objectId: id,
        predictionType: 'LEAD_SCORE',
        prediction: {
          score: prediction.score,
        },
        confidence: prediction.confidence,
        reasoning: prediction.reasoning,
      },
    });

    return NextResponse.json(aiPrediction);
  } catch (error: any) {
    console.error('Error generating lead score:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
