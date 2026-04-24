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
    const resourceId = searchParams.get('resourceId');

    const where: any = {};
    if (resourceId) {
      where.resourceId = resourceId;
    }

    const total = await prisma.serviceResourceSkill.count({ where });
    const items = await prisma.serviceResourceSkill.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
      include: {
        resource: { select: { id: true, name: true } },
        skill: { select: { id: true, name: true } },
      },
    });

    const paginatedResponse = buildPaginatedResponse(items, total, paginationParams);
    return NextResponse.json(paginatedResponse);
  } catch (error) {
    console.error('Error fetching resource skills:', error);
    return NextResponse.json({ error: 'Failed to fetch resource skills' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const record = await prisma.serviceResourceSkill.create({ data: body });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating resource skill:', error);
    return NextResponse.json({ error: 'Failed to create resource skill' }, { status: 500 });
  }
}
