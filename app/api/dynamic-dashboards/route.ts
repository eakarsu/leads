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
    const ownerId = searchParams.get('ownerId');

    const where = {
      ...(ownerId && { ownerId }),
    };

    const total = await prisma.dynamicDashboard.count({ where });

    const dashboards = await prisma.dynamicDashboard.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(dashboards, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching dynamic dashboards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dynamic dashboards' },
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

    const dashboard = await prisma.dynamicDashboard.create({
      data: {
        ...body,
        ownerId: body.ownerId || session.user.id,
      },
    });

    return NextResponse.json(dashboard, { status: 201 });
  } catch (error: any) {
    console.error('Error creating dynamic dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to create dynamic dashboard' },
      { status: 500 }
    );
  }
}
