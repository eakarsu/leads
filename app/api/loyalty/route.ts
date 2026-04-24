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

    const total = await prisma.loyaltyProgram.count({ where });

    const programs = await prisma.loyaltyProgram.findMany({
      where,
      include: {
        _count: {
          select: {
            tiers: true,
            members: true,
          },
        },
      },
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(programs, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching loyalty programs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty programs' },
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

    const program = await prisma.loyaltyProgram.create({
      data: body,
    });

    return NextResponse.json(program, { status: 201 });
  } catch (error: any) {
    console.error('Error creating loyalty program:', error);
    return NextResponse.json(
      { error: 'Failed to create loyalty program' },
      { status: 500 }
    );
  }
}
