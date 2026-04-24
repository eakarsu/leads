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
    const resourceId = searchParams.get('resourceId');
    const status = searchParams.get('status');

    const where: any = {};
    if (resourceId) {
      where.resourceId = resourceId;
    }
    if (status) {
      where.status = status;
    }

    const total = await prisma.timeSheet.count({ where });
    const items = await prisma.timeSheet.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
      include: {
        resource: { select: { id: true, name: true } },
        _count: { select: { entries: true } },
      },
    });

    const paginatedResponse = buildPaginatedResponse(items, total, paginationParams);
    return NextResponse.json(paginatedResponse);
  } catch (error) {
    console.error('Error fetching time sheets:', error);
    return NextResponse.json({ error: 'Failed to fetch time sheets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const record = await prisma.timeSheet.create({ data: body });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating time sheet:', error);
    return NextResponse.json({ error: 'Failed to create time sheet' }, { status: 500 });
  }
}
