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
    const caseId = searchParams.get('caseId');
    const status = searchParams.get('status');

    const where = {
      ...(caseId && { caseId }),
      ...(status && { status: status as any }),
    };

    const total = await prisma.caseMilestone.count({ where });

    const caseMilestones = await prisma.caseMilestone.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(caseMilestones, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching case milestones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch case milestones' },
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

    const caseMilestone = await prisma.caseMilestone.create({
      data: body,
    });

    return NextResponse.json(caseMilestone, { status: 201 });
  } catch (error: any) {
    console.error('Error creating case milestone:', error);
    return NextResponse.json(
      { error: 'Failed to create case milestone' },
      { status: 500 }
    );
  }
}
