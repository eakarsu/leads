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
    const campaignId = searchParams.get('campaignId');

    const reports = await prisma.reportSnapshot.findMany({
      where: {
        ...(clientId && { clientId }),
        ...(campaignId && { campaignId }),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        periodEnd: 'desc',
      },
    });

    return NextResponse.json(reports);
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { clientId, campaignId, periodStart, periodEnd, metrics, aiSummary } = body;

    if (!clientId || !periodStart || !periodEnd || !metrics) {
      return NextResponse.json(
        { error: 'Client ID, period dates, and metrics are required' },
        { status: 400 }
      );
    }

    const report = await prisma.reportSnapshot.create({
      data: {
        clientId,
        campaignId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        metrics,
        aiSummary,
      },
      include: {
        client: true,
        campaign: true,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error: any) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
