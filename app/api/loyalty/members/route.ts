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
    const programId = searchParams.get('programId');
    const contactId = searchParams.get('contactId');

    const where = {
      ...(programId && { programId }),
      ...(contactId && { contactId }),
    };

    const total = await prisma.loyaltyMember.count({ where });

    const members = await prisma.loyaltyMember.findMany({
      where,
      include: {
        program: {
          select: { id: true, name: true },
        },
        transactions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(members, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching loyalty members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty members' },
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

    const member = await prisma.loyaltyMember.create({
      data: body,
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    console.error('Error creating loyalty member:', error);
    return NextResponse.json(
      { error: 'Failed to create loyalty member' },
      { status: 500 }
    );
  }
}
