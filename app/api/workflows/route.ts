import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const objectType = searchParams.get('objectType');
    const isActive = searchParams.get('isActive');

    const workflows = await prisma.workflowRule.findMany({
      where: {
        ...(objectType && { objectType }),
        ...(isActive !== null && { isActive: isActive === 'true' }),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(workflows);
  } catch (error: any) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
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
      name,
      description,
      objectType,
      triggerType,
      conditions,
      actions,
      isActive,
    } = body;

    if (!name || !objectType || !triggerType || !conditions || !actions) {
      return NextResponse.json(
        { error: 'name, objectType, triggerType, conditions, and actions are required' },
        { status: 400 }
      );
    }

    const workflow = await prisma.workflowRule.create({
      data: {
        name,
        description,
        objectType,
        triggerType,
        conditions,
        actions,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error: any) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}
