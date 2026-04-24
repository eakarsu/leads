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
    const territoryId = searchParams.get('territoryId');

    const where: any = {};
    if (territoryId) {
      where.territoryId = territoryId;
    }

    const total = await prisma.fieldServiceAsset.count({ where });
    const items = await prisma.fieldServiceAsset.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
      include: {
        territory: { select: { id: true, name: true } },
      },
    });

    const paginatedResponse = buildPaginatedResponse(items, total, paginationParams);
    return NextResponse.json(paginatedResponse);
  } catch (error) {
    console.error('Error fetching field service assets:', error);
    return NextResponse.json({ error: 'Failed to fetch field service assets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const record = await prisma.fieldServiceAsset.create({ data: body });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating field service asset:', error);
    return NextResponse.json({ error: 'Failed to create field service asset' }, { status: 500 });
  }
}
