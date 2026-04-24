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
    const testType = searchParams.get('testType');

    const where = {
      ...(status && { status: status as any }),
      ...(testType && { testType: testType as any }),
    };

    const total = await prisma.aBTest.count({ where });

    const abTests = await prisma.aBTest.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(abTests, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching A/B tests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch A/B tests' },
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

    const abTest = await prisma.aBTest.create({
      data: body,
    });

    return NextResponse.json(abTest, { status: 201 });
  } catch (error: any) {
    console.error('Error creating A/B test:', error);
    return NextResponse.json(
      { error: 'Failed to create A/B test' },
      { status: 500 }
    );
  }
}
