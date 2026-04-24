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
    const assetId = searchParams.get('assetId');

    const where: any = {};
    if (territoryId) {
      where.territoryId = territoryId;
    }
    if (assetId) {
      where.assetId = assetId;
    }

    const total = await prisma.maintenancePlan.count({ where });
    const items = await prisma.maintenancePlan.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
      include: {
        workType: { select: { id: true, name: true } },
        asset: { select: { id: true, name: true } },
        territory: { select: { id: true, name: true } },
      },
    });

    const paginatedResponse = buildPaginatedResponse(items, total, paginationParams);
    return NextResponse.json(paginatedResponse);
  } catch (error) {
    console.error('Error fetching maintenance plans:', error);
    return NextResponse.json({ error: 'Failed to fetch maintenance plans' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const record = await prisma.maintenancePlan.create({ data: body });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance plan:', error);
    return NextResponse.json({ error: 'Failed to create maintenance plan' }, { status: 500 });
  }
}
