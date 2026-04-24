import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parsePaginationParams, buildPrismaQuery, buildPaginatedResponse } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paginationParams = parsePaginationParams(request);

    const { searchParams } = new URL(request.url);
    const objectType = searchParams.get('objectType');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (objectType) where.objectType = objectType;
    if (isActive !== null) where.isActive = isActive === 'true';

    const total = await prisma.processFlow.count({ where });

    const flows = await prisma.processFlow.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            executions: true,
          },
        },
      },
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(flows, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching process flows:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, objectType, nodes, edges, isActive } = body;

    if (!name || !objectType || !nodes || !edges) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const flow = await prisma.processFlow.create({
      data: {
        name,
        description,
        objectType,
        nodes,
        edges,
        isActive: isActive || false,
        createdBy: session.user.id,
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

    return NextResponse.json(flow, { status: 201 });
  } catch (error: any) {
    console.error('Error creating process flow:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
