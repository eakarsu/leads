import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const flow = await prisma.processFlow.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        executions: {
          take: 10,
          orderBy: {
            startedAt: 'desc',
          },
        },
      },
    });

    if (!flow) {
      return NextResponse.json({ error: 'Process flow not found' }, { status: 404 });
    }

    return NextResponse.json(flow);
  } catch (error: any) {
    console.error('Error fetching process flow:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, objectType, nodes, edges, isActive } = body;

    const { id } = await params;

    const flow = await prisma.processFlow.update({
      where: { id },
      data: {
        name,
        description,
        objectType,
        nodes,
        edges,
        isActive,
        version: {
          increment: 1,
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(flow);
  } catch (error: any) {
    console.error('Error updating process flow:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.processFlow.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Process flow deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting process flow:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
