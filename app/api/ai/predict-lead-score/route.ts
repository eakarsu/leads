import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { predictLeadScore } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leadId } = await request.json();

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        client: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Call AI to predict lead score
    const prediction = await predictLeadScore(lead);

    // Store prediction in database
    await prisma.aIPrediction.create({
      data: {
        predictionType: 'LEAD_SCORE',
        objectType: 'Lead',
        objectId: leadId,
        prediction: {
          score: prediction.score,
        },
        confidence: prediction.confidence,
        reasoning: prediction.reasoning,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return NextResponse.json(prediction);
  } catch (error: any) {
    console.error('Error predicting lead score:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
