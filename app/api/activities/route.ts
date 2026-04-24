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
    const leadId = searchParams.get('leadId');
    const type = searchParams.get('type');
    const campaignId = searchParams.get('campaignId');

    const where = {
      ...(leadId && { leadId }),
      ...(type && { type: type as any }),
      ...(campaignId && {
        lead: {
          campaignId: campaignId,
        },
      }),
    };

    const total = await prisma.leadActivity.count({ where });

    const activities = await prisma.leadActivity.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            fullName: true,
            company: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(activities, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
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
    const { leadId, type, content, timestamp } = body;

    if (!leadId || !type || !content) {
      return NextResponse.json(
        { error: 'Lead ID, type, and content are required' },
        { status: 400 }
      );
    }

    const activity = await prisma.leadActivity.create({
      data: {
        leadId,
        type,
        content,
        userId: session.user.id,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      },
      include: {
        lead: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error: any) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}
