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
    const territoryId = searchParams.get('territoryId');

    const where: any = {};
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }
    if (territoryId) {
      where.territoryId = territoryId;
    }

    const total = await prisma.serviceResource.count({ where });
    const items = await prisma.serviceResource.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
      include: {
        territory: { select: { id: true, name: true } },
        _count: { select: { skills: true, absences: true } },
      },
    });

    const paginatedResponse = buildPaginatedResponse(items, total, paginationParams);
    return NextResponse.json(paginatedResponse);
  } catch (error) {
    console.error('Error fetching service resources:', error);
    return NextResponse.json({ error: 'Failed to fetch service resources' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const record = await prisma.serviceResource.create({ data: body });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating service resource:', error);
    return NextResponse.json({ error: 'Failed to create service resource' }, { status: 500 });
  }
}
