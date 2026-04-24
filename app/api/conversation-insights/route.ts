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
    const sentiment = searchParams.get('sentiment');

    const where = {
      ...(objectType && { objectType: objectType as any }),
      ...(sentiment && { sentiment: sentiment as any }),
    };

    const total = await prisma.conversationInsight.count({ where });

    const conversationInsights = await prisma.conversationInsight.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(conversationInsights, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching conversation insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation insights' },
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

    const conversationInsight = await prisma.conversationInsight.create({
      data: body,
    });

    return NextResponse.json(conversationInsight, { status: 201 });
  } catch (error: any) {
    console.error('Error creating conversation insight:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation insight' },
      { status: 500 }
    );
  }
}
