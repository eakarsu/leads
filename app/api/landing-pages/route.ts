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

    const total = await prisma.landingPage.count({ where });

    const landingPages = await prisma.landingPage.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(landingPages, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching landing pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch landing pages' },
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

    const landingPage = await prisma.landingPage.create({
      data: body,
    });

    return NextResponse.json(landingPage, { status: 201 });
  } catch (error: any) {
    console.error('Error creating landing page:', error);
    return NextResponse.json(
      { error: 'Failed to create landing page' },
      { status: 500 }
    );
  }
}
