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
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');
    const sentiment = searchParams.get('sentiment');

    const where = {
      ...(platform && { platform: platform as any }),
      ...(status && { status: status as any }),
      ...(sentiment && { sentiment: sentiment as any }),
    };

    const total = await prisma.socialPost.count({ where });

    const socialPosts = await prisma.socialPost.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(socialPosts, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching social posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social posts' },
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

    const socialPost = await prisma.socialPost.create({
      data: body,
    });

    return NextResponse.json(socialPost, { status: 201 });
  } catch (error: any) {
    console.error('Error creating social post:', error);
    return NextResponse.json(
      { error: 'Failed to create social post' },
      { status: 500 }
    );
  }
}
