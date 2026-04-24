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
    const assignedTo = searchParams.get('assignedTo');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const opportunityId = searchParams.get('opportunityId');
    const contactId = searchParams.get('contactId');

    const where = {
      ...(assignedTo && { assignedTo }),
      ...(status && { status: status as any }),
      ...(priority && { priority: priority as any }),
      ...(opportunityId && { opportunityId }),
      ...(contactId && { contactId }),
    };

    const total = await prisma.task.count({ where });

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contact: true,
        opportunity: true,
      },
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(tasks, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
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
      subject,
      description,
      dueDate,
      status,
      priority,
      assignedTo,
      contactId,
      opportunityId,
      relatedTo,
      reminderDate,
    } = body;

    const task = await prisma.task.create({
      data: {
        subject,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'NOT_STARTED',
        priority: priority || 'MEDIUM',
        assignedTo: assignedTo || session.user.id,
        createdBy: session.user.id,
        contactId,
        opportunityId,
        relatedTo,
        reminderDate: reminderDate ? new Date(reminderDate) : null,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contact: true,
        opportunity: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
