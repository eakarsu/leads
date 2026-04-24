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
    const workOrderId = searchParams.get('workOrderId');

    const where: any = {};
    if (workOrderId) {
      where.workOrderId = workOrderId;
    }

    const total = await prisma.workOrderLineItem.count({ where });
    const items = await prisma.workOrderLineItem.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
      include: {
        workOrder: { select: { id: true, workOrderNumber: true } },
        workType: { select: { id: true, name: true } },
      },
    });

    const paginatedResponse = buildPaginatedResponse(items, total, paginationParams);
    return NextResponse.json(paginatedResponse);
  } catch (error) {
    console.error('Error fetching work order line items:', error);
    return NextResponse.json({ error: 'Failed to fetch work order line items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const record = await prisma.workOrderLineItem.create({ data: body });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating work order line item:', error);
    return NextResponse.json({ error: 'Failed to create work order line item' }, { status: 500 });
  }
}
