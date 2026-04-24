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

    const total = await prisma.einsteinBot.count({ where });

    const einsteinBots = await prisma.einsteinBot.findMany({
      where,
      include: {
        _count: {
          select: {
            dialogs: true,
          },
        },
      },
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(einsteinBots, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching einstein bots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch einstein bots' },
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

    const einsteinBot = await prisma.einsteinBot.create({
      data: body,
    });

    return NextResponse.json(einsteinBot, { status: 201 });
  } catch (error: any) {
    console.error('Error creating einstein bot:', error);
    return NextResponse.json(
      { error: 'Failed to create einstein bot' },
      { status: 500 }
    );
  }
}
