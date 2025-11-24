import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const ownerId = searchParams.get('ownerId');

    const opportunities = await prisma.opportunity.findMany({
      where: {
        ...(clientId && { clientId }),
        ...(ownerId && { ownerId }),
        stage: {
          notIn: ['CLOSED_WON', 'CLOSED_LOST'],
        },
      },
      include: {
        client: true,
        contact: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lineItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        expectedCloseDate: 'asc',
      },
    });

    // Group by stage
    const pipeline = {
      PROSPECTING: opportunities.filter((o) => o.stage === 'PROSPECTING'),
      QUALIFICATION: opportunities.filter((o) => o.stage === 'QUALIFICATION'),
      NEEDS_ANALYSIS: opportunities.filter((o) => o.stage === 'NEEDS_ANALYSIS'),
      PROPOSAL: opportunities.filter((o) => o.stage === 'PROPOSAL'),
      NEGOTIATION: opportunities.filter((o) => o.stage === 'NEGOTIATION'),
    };

    // Calculate totals
    const totals = {
      PROSPECTING: pipeline.PROSPECTING.reduce((sum, o) => sum + (o.amount * o.probability / 100), 0),
      QUALIFICATION: pipeline.QUALIFICATION.reduce((sum, o) => sum + (o.amount * o.probability / 100), 0),
      NEEDS_ANALYSIS: pipeline.NEEDS_ANALYSIS.reduce((sum, o) => sum + (o.amount * o.probability / 100), 0),
      PROPOSAL: pipeline.PROPOSAL.reduce((sum, o) => sum + (o.amount * o.probability / 100), 0),
      NEGOTIATION: pipeline.NEGOTIATION.reduce((sum, o) => sum + (o.amount * o.probability / 100), 0),
    };

    return NextResponse.json({
      pipeline,
      totals,
      totalWeightedValue: Object.values(totals).reduce((sum, v) => sum + v, 0),
      totalCount: opportunities.length,
    });
  } catch (error: any) {
    console.error('Error fetching pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline' },
      { status: 500 }
    );
  }
}
