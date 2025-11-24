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

    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        client: true,
        contact: true,
        lead: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lineItems: {
          include: {
            product: true,
          },
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            dueDate: 'asc',
          },
        },
        events: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            startTime: 'asc',
          },
        },
      },
    });

    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(opportunity);
  } catch (error: any) {
    console.error('Error fetching opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunity' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      name,
      stage,
      amount,
      probability,
      expectedCloseDate,
      closedDate,
      description,
      nextSteps,
      lostReason,
      competitorInfo,
    } = body;

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(stage !== undefined && { stage }),
        ...(amount !== undefined && { amount }),
        ...(probability !== undefined && { probability }),
        ...(expectedCloseDate !== undefined && {
          expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        }),
        ...(closedDate !== undefined && {
          closedDate: closedDate ? new Date(closedDate) : null,
        }),
        ...(description !== undefined && { description }),
        ...(nextSteps !== undefined && { nextSteps }),
        ...(lostReason !== undefined && { lostReason }),
        ...(competitorInfo !== undefined && { competitorInfo }),
      },
      include: {
        client: true,
        contact: true,
        lead: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lineItems: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(opportunity);
  } catch (error: any) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to update opportunity' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.opportunity.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to delete opportunity' },
      { status: 500 }
    );
  }
}
