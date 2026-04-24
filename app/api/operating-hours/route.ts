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
    const where: any = {};

    const total = await prisma.operatingHours.count({ where });
    const items = await prisma.operatingHours.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
    });

    const paginatedResponse = buildPaginatedResponse(items, total, paginationParams);
    return NextResponse.json(paginatedResponse);
  } catch (error) {
    console.error('Error fetching operating hours:', error);
    return NextResponse.json({ error: 'Failed to fetch operating hours' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const record = await prisma.operatingHours.create({ data: body });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating operating hours:', error);
    return NextResponse.json({ error: 'Failed to create operating hours' }, { status: 500 });
  }
}
