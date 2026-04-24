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

    const paginationParams = parsePaginationParams(req, { sortBy: 'priority', sortOrder: 'desc' });

    const where = {
      status: { in: ['NEW', 'PENDING', 'OPEN', 'IN_PROGRESS'] as any },
    };

    const total = await prisma.workOrder.count({ where });
    const workOrders = await prisma.workOrder.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
      include: {
        territory: { select: { id: true, name: true } },
        workType: { select: { id: true, name: true, estimatedDurationMinutes: true } },
        account: { select: { id: true, name: true } },
        _count: { select: { appointments: true } },
      },
    });

    const paginatedResponse = buildPaginatedResponse(workOrders, total, paginationParams);
    return NextResponse.json(paginatedResponse);
  } catch (error) {
    console.error('Error fetching schedulable work orders:', error);
    return NextResponse.json({ error: 'Failed to fetch schedulable work orders' }, { status: 500 });
  }
}
