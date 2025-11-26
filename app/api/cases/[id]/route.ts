import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const caseRecord = await prisma.case.findUnique({
      where: { id },
      include: {
        queue: true,
        parentCase: true,
        childCases: true,
        comments: {
          orderBy: { createdAt: 'desc' },
        },
        escalations: {
          orderBy: { escalatedAt: 'desc' },
        },
      },
    });

    if (!caseRecord) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json(caseRecord);
  } catch (error: any) {
    console.error('Error fetching case:', error);
    return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const {
      subject,
      description,
      status,
      priority,
      type,
      reason,
      ownerId,
      queueId,
      resolution,
      internalComments,
    } = body;

    const updateData: any = {};
    if (subject !== undefined) updateData.subject = subject;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'CLOSED' || status === 'RESOLVED') {
        updateData.closedAt = new Date();
      }
    }
    if (priority !== undefined) updateData.priority = priority;
    if (type !== undefined) updateData.type = type;
    if (reason !== undefined) updateData.reason = reason;
    if (ownerId !== undefined) updateData.ownerId = ownerId;
    if (queueId !== undefined) updateData.queueId = queueId;
    if (resolution !== undefined) updateData.resolution = resolution;
    if (internalComments !== undefined) updateData.internalComments = internalComments;

    const updatedCase = await prisma.case.update({
      where: { id },
      data: updateData,
      include: {
        queue: true,
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return NextResponse.json(updatedCase);
  } catch (error: any) {
    console.error('Error updating case:', error);
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.case.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting case:', error);
    return NextResponse.json({ error: 'Failed to delete case' }, { status: 500 });
  }
}
