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
    const resourceId = searchParams.get('resourceId');
    const workOrderId = searchParams.get('workOrderId');
    const territoryId = searchParams.get('territoryId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (resourceId) {
      where.resourceId = resourceId;
    }
    if (workOrderId) {
      where.workOrderId = workOrderId;
    }
    if (territoryId) {
      where.territoryId = territoryId;
    }
    if (startDate && endDate) {
      where.scheduledStart = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [total, items, ...statusCounts] = await Promise.all([
      prisma.serviceAppointment.count({ where }),
      prisma.serviceAppointment.findMany({
        where,
        ...buildPrismaQuery(paginationParams),
        include: {
          workOrder: { select: { id: true, workOrderNumber: true, subject: true } },
          resource: { select: { id: true, name: true } },
          territory: { select: { id: true, name: true } },
        },
      }),
      prisma.serviceAppointment.count({ where: { ...where, status: 'SCHEDULED' } }),
      prisma.serviceAppointment.count({ where: { ...where, status: 'DISPATCHED' } }),
      prisma.serviceAppointment.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.serviceAppointment.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.serviceAppointment.count({ where: { ...where, status: 'CANCELLED' } }),
      prisma.serviceAppointment.count({ where: { ...where, status: 'CANNOT_COMPLETE' } }),
    ]);

    const paginatedResponse = buildPaginatedResponse(items, total, paginationParams);
    return NextResponse.json({
      ...paginatedResponse,
      stats: {
        byStatus: {
          SCHEDULED: statusCounts[0],
          DISPATCHED: statusCounts[1],
          IN_PROGRESS: statusCounts[2],
          COMPLETED: statusCounts[3],
          CANCELLED: statusCounts[4],
          CANNOT_COMPLETE: statusCounts[5],
        },
      },
    });
  } catch (error) {
    console.error('Error fetching service appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch service appointments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const count = await prisma.serviceAppointment.count();
    const appointmentNumber = `SA-${String(count + 1).padStart(6, '0')}`;

    const record = await prisma.serviceAppointment.create({
      data: {
        ...body,
        appointmentNumber,
      },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating service appointment:', error);
    return NextResponse.json({ error: 'Failed to create service appointment' }, { status: 500 });
  }
}
