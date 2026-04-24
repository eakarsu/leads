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
    const isActive = searchParams.get('isActive');
    const parentId = searchParams.get('parentId');

    const where: any = {};
    if (isActive !== null && isActive !== '') where.isActive = isActive === 'true';
    if (parentId) where.parentId = parentId;

    const total = await prisma.serviceTerritory.count({ where });
    const items = await prisma.serviceTerritory.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
      include: { parent: { select: { id: true, name: true } }, _count: { select: { members: true, workOrders: true } } },
    });

    const stats = {
      total,
      active: await prisma.serviceTerritory.count({ where: { isActive: true } }),
      inactive: await prisma.serviceTerritory.count({ where: { isActive: false } }),
    };

    const paginatedResponse = buildPaginatedResponse(items, total, paginationParams);
    return NextResponse.json({ ...paginatedResponse, stats });
  } catch (error) {
    console.error('Error fetching service territories:', error);
    return NextResponse.json({ error: 'Failed to fetch service territories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, type, parentId, description, city, state, country, latitude, longitude, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const record = await prisma.serviceTerritory.create({
      data: { name, type, parentId, description, city, state, country, latitude, longitude, isActive },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating service territory:', error);
    return NextResponse.json({ error: 'Failed to create service territory' }, { status: 500 });
  }
}
