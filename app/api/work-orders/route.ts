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
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const territoryId = searchParams.get('territoryId');
    const accountId = searchParams.get('accountId');

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (territoryId) {
      where.territoryId = territoryId;
    }
    if (accountId) {
      where.accountId = accountId;
    }

    const [total, items, statusNew, statusPending, statusOpen, statusInProgress, statusCompleted, statusCancelled, priorityLow, priorityMedium, priorityHigh, priorityCritical, priorityEmergency] = await Promise.all([
      prisma.workOrder.count({ where }),
      prisma.workOrder.findMany({
        where,
        ...buildPrismaQuery(paginationParams),
        include: {
          territory: { select: { id: true, name: true } },
          workType: { select: { id: true, name: true } },
          account: { select: { id: true, name: true } },
        },
      }),
      prisma.workOrder.count({ where: { ...where, status: 'NEW' } }),
      prisma.workOrder.count({ where: { ...where, status: 'PENDING' } }),
      prisma.workOrder.count({ where: { ...where, status: 'OPEN' } }),
      prisma.workOrder.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.workOrder.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.workOrder.count({ where: { ...where, status: 'CANCELLED' } }),
      prisma.workOrder.count({ where: { ...where, priority: 'LOW' } }),
      prisma.workOrder.count({ where: { ...where, priority: 'MEDIUM' } }),
      prisma.workOrder.count({ where: { ...where, priority: 'HIGH' } }),
      prisma.workOrder.count({ where: { ...where, priority: 'CRITICAL' } }),
      prisma.workOrder.count({ where: { ...where, priority: 'EMERGENCY' } }),
    ]);

    const paginatedResponse = buildPaginatedResponse(items, total, paginationParams);
    return NextResponse.json({
      ...paginatedResponse,
      stats: {
        byStatus: {
          NEW: statusNew,
          PENDING: statusPending,
          OPEN: statusOpen,
          IN_PROGRESS: statusInProgress,
          COMPLETED: statusCompleted,
          CANCELLED: statusCancelled,
        },
        byPriority: {
          LOW: priorityLow,
          MEDIUM: priorityMedium,
          HIGH: priorityHigh,
          CRITICAL: priorityCritical,
          EMERGENCY: priorityEmergency,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching work orders:', error);
    return NextResponse.json({ error: 'Failed to fetch work orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    if (!body.subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    const count = await prisma.workOrder.count();
    const workOrderNumber = `WO-${String(count + 1).padStart(6, '0')}`;

    const record = await prisma.workOrder.create({
      data: {
        ...body,
        workOrderNumber,
      },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating work order:', error);
    return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 });
  }
}
