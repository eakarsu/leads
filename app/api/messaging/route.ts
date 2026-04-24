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
    const channel = searchParams.get('channel');
    const status = searchParams.get('status');
    const contactId = searchParams.get('contactId');

    const where = {
      ...(channel && { channel: channel as any }),
      ...(status && { status: status as any }),
      ...(contactId && { contactId }),
    };

    const total = await prisma.messagingConversation.count({ where });

    const conversations = await prisma.messagingConversation.findMany({
      where,
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(conversations, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching messaging conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messaging conversations' },
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

    const conversation = await prisma.messagingConversation.create({
      data: body,
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error: any) {
    console.error('Error creating messaging conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create messaging conversation' },
      { status: 500 }
    );
  }
}
