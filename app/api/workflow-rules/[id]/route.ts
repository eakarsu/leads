import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflowRule = await prisma.workflowRule.findUnique({
      where: { id: params.id },
    });

    if (!workflowRule) {
      return NextResponse.json(
        { error: 'Workflow rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(workflowRule);
  } catch (error: any) {
    console.error('Error fetching workflow rule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow rule' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      description,
      objectType,
      triggerType,
      conditions,
      actions,
      isActive,
    } = body;

    const workflowRule = await prisma.workflowRule.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(objectType !== undefined && { objectType }),
        ...(triggerType !== undefined && { triggerType }),
        ...(conditions !== undefined && { conditions }),
        ...(actions !== undefined && { actions }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(workflowRule);
  } catch (error: any) {
    console.error('Error updating workflow rule:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.workflowRule.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting workflow rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow rule' },
      { status: 500 }
    );
  }
}
