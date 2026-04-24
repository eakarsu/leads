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
    const objectType = searchParams.get('objectType');
    const isActive = searchParams.get('isActive');
    const triggerType = searchParams.get('triggerType');

    const where = {
      ...(objectType && { objectType }),
      ...(isActive !== null && { isActive: isActive === 'true' }),
      ...(triggerType && { triggerType }),
    };

    const total = await prisma.workflowRule.count({ where });

    const workflowRules = await prisma.workflowRule.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(workflowRules, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching workflow rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow rules' },
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

    const workflowRule = await prisma.workflowRule.create({
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

    return NextResponse.json(workflowRule, { status: 201 });
  } catch (error: any) {
    console.error('Error creating workflow rule:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow rule' },
      { status: 500 }
    );
  }
}
