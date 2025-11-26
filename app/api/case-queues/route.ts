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

    const queues = await prisma.caseQueue.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { cases: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(queues);
  } catch (error: any) {
    console.error('Error fetching case queues:', error);
    return NextResponse.json({ error: 'Failed to fetch queues' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, memberIds } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const queue = await prisma.caseQueue.create({
      data: {
        name,
        description,
        memberIds: memberIds || [],
      },
    });

    return NextResponse.json(queue, { status: 201 });
  } catch (error: any) {
    console.error('Error creating case queue:', error);
    return NextResponse.json({ error: 'Failed to create queue' }, { status: 500 });
  }
}
