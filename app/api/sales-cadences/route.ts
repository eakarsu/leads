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
    const status = searchParams.get('status');

    const where = {
      ...(status && { status: status as any }),
    };

    const total = await prisma.salesCadence.count({ where });

    const salesCadences = await prisma.salesCadence.findMany({
      where,
      include: {
        _count: {
          select: {
            steps: true,
            enrollments: true,
          },
        },
      },
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(salesCadences, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching sales cadences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales cadences' },
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

    const salesCadence = await prisma.salesCadence.create({
      data: {
        ...body,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(salesCadence, { status: 201 });
  } catch (error: any) {
    console.error('Error creating sales cadence:', error);
    return NextResponse.json(
      { error: 'Failed to create sales cadence' },
      { status: 500 }
    );
  }
}
