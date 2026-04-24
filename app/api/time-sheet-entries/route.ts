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
    const timeSheetId = searchParams.get('timeSheetId');
    const resourceId = searchParams.get('resourceId');
    const workOrderId = searchParams.get('workOrderId');

    const where: any = {};
    if (timeSheetId) {
      where.timeSheetId = timeSheetId;
    }
    if (resourceId) {
      where.resourceId = resourceId;
    }
    if (workOrderId) {
      where.workOrderId = workOrderId;
    }

    const total = await prisma.timeSheetEntry.count({ where });
    const items = await prisma.timeSheetEntry.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
      include: {
        timeSheet: { select: { id: true } },
        resource: { select: { id: true, name: true } },
        workOrder: { select: { id: true, workOrderNumber: true } },
      },
    });

    const paginatedResponse = buildPaginatedResponse(items, total, paginationParams);
    return NextResponse.json(paginatedResponse);
  } catch (error) {
    console.error('Error fetching time sheet entries:', error);
    return NextResponse.json({ error: 'Failed to fetch time sheet entries' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const record = await prisma.timeSheetEntry.create({ data: body });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating time sheet entry:', error);
    return NextResponse.json({ error: 'Failed to create time sheet entry' }, { status: 500 });
  }
}
