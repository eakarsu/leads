import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parsePaginationParams, buildPrismaQuery, buildPaginatedResponse } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paginationParams = parsePaginationParams(req);

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const channel = searchParams.get('channel');

    const where = {
      ...(clientId && { clientId }),
      ...(status && { status: status as any }),
      ...(channel && { channel: channel as any }),
    };

    const total = await prisma.campaign.count({ where });

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        client: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            leads: true,
          },
        },
      },
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(campaigns, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
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
    const {
      clientId,
      name,
      description,
      status,
      channel,
      targetPersona,
      targetRegions,
      startDate,
      endDate,
    } = body;

    if (!clientId || !name || !channel) {
      return NextResponse.json(
        { error: 'Client ID, name, and channel are required' },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        clientId,
        name,
        description,
        status: status || 'DRAFT',
        channel,
        targetPersona,
        targetRegions,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        ownerId: session.user.id,
      },
      include: {
        client: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
