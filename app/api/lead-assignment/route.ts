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
    const isActive = searchParams.get('isActive');

    const rules = await prisma.leadAssignmentRule.findMany({
      where: {
        ...(isActive !== null && { isActive: isActive === 'true' }),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(rules);
  } catch (error: any) {
    console.error('Error fetching assignment rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment rules' },
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
      criteria,
      assignmentMethod,
      assignToUserIds,
      territoryId,
      isActive,
      priority,
    } = body;

    if (!name || !criteria || !assignmentMethod || !assignToUserIds) {
      return NextResponse.json(
        {
          error: 'name, criteria, assignmentMethod, and assignToUserIds are required',
        },
        { status: 400 }
      );
    }

    const rule = await prisma.leadAssignmentRule.create({
      data: {
        name,
        description,
        criteria,
        assignmentMethod,
        assignToUserIds,
        territoryId,
        isActive: isActive !== undefined ? isActive : true,
        priority: priority !== undefined ? priority : 0,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error: any) {
    console.error('Error creating assignment rule:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment rule' },
      { status: 500 }
    );
  }
}
