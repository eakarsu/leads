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
    const objectType = searchParams.get('objectType');
    const isActive = searchParams.get('isActive');

    const where = {
      ...(objectType && { objectType: objectType as any }),
      ...(isActive !== null && isActive !== undefined && isActive !== '' && { isActive: isActive === 'true' }),
    };

    const total = await prisma.validationRule.count({ where });

    const validationRules = await prisma.validationRule.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(validationRules, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching validation rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch validation rules' },
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

    const validationRule = await prisma.validationRule.create({
      data: body,
    });

    return NextResponse.json(validationRule, { status: 201 });
  } catch (error: any) {
    console.error('Error creating validation rule:', error);
    return NextResponse.json(
      { error: 'Failed to create validation rule' },
      { status: 500 }
    );
  }
}
