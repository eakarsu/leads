import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateLeadScore } from '@/lib/leadScoring';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
        },
        enrichmentData: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const enrichment = lead.enrichmentData[0] || null;
    const scores = calculateLeadScore(lead, lead.activities, enrichment);

    // Get score history
    const scoreHistory = await prisma.leadScore.findMany({
      where: { leadId: id },
      orderBy: { calculatedAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      current: scores,
      history: scoreHistory,
    });
  } catch (error: any) {
    console.error('Lead scoring error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate lead score' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
        },
        enrichmentData: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const enrichment = lead.enrichmentData[0] || null;
    const scores = calculateLeadScore(lead, lead.activities, enrichment);

    // Update lead's qualification score
    await prisma.lead.update({
      where: { id },
      data: { qualificationScore: scores.total },
    });

    // Save score breakdown to history
    const scoreRecords = scores.breakdown.map((item) => ({
      leadId: id,
      score: item.points,
      category: item.category as any,
      reason: item.reason,
      factors: item as any,
    }));

    await prisma.leadScore.createMany({
      data: scoreRecords,
    });

    return NextResponse.json({
      success: true,
      score: scores.total,
      breakdown: scores,
    });
  } catch (error: any) {
    console.error('Lead score calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to save lead score' },
      { status: 500 }
    );
  }
}
