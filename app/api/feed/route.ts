import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parentType = searchParams.get('parentType');
    const parentId = searchParams.get('parentId');
    const authorId = searchParams.get('authorId');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (parentType) where.parentType = parentType;
    if (parentId) where.parentId = parentId;
    if (authorId) where.authorId = authorId;

    const feedItems = await prisma.feedItem.findMany({
      where,
      include: {
        comments: {
          take: 5,
          orderBy: { createdAt: 'asc' },
        },
        likes: {
          take: 5,
        },
        mentions: true,
        _count: {
          select: { comments: true, likes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get unique author IDs from feed items and comments
    const authorIds = new Set<string>();
    feedItems.forEach(item => {
      authorIds.add(item.authorId);
      item.comments.forEach(comment => authorIds.add(comment.authorId));
    });

    // Fetch all authors at once
    const authors = await prisma.user.findMany({
      where: { id: { in: Array.from(authorIds) } },
      select: { id: true, name: true, email: true },
    });
    const authorMap = new Map(authors.map(a => [a.id, a]));

    // Attach author info to feed items and comments
    const feedItemsWithAuthors = feedItems.map(item => ({
      ...item,
      author: authorMap.get(item.authorId),
      comments: item.comments.map(comment => ({
        ...comment,
        author: authorMap.get(comment.authorId),
      })),
    }));

    return NextResponse.json(feedItemsWithAuthors);
  } catch (error: any) {
    console.error('Error fetching feed:', error);
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, bodyText, parentId, parentType, linkUrl, linkTitle, visibility, mentions } = body;

    if (!bodyText) {
      return NextResponse.json({ error: 'Body text is required' }, { status: 400 });
    }

    const feedItem = await prisma.feedItem.create({
      data: {
        type: type || 'TEXT_POST',
        body: bodyText,
        parentId,
        parentType,
        authorId: session.user.id,
        linkUrl,
        linkTitle,
        visibility: visibility || 'ALL_USERS',
        mentions: mentions
          ? {
              create: mentions.map((userId: string) => ({
                userId,
              })),
            }
          : undefined,
      },
      include: {
        mentions: true,
      },
    });

    // Create notifications for mentioned users
    if (mentions && mentions.length > 0) {
      await prisma.notification.createMany({
        data: mentions.map((userId: string) => ({
          userId,
          type: 'MENTION',
          title: 'You were mentioned',
          message: `${session.user.name || 'Someone'} mentioned you in a post`,
          link: `/chatter?feedItemId=${feedItem.id}`,
        })),
      });
    }

    return NextResponse.json(feedItem, { status: 201 });
  } catch (error: any) {
    console.error('Error creating feed item:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

// Like/Unlike a post or add a comment
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, feedItemId, commentId, commentBody } = body;

    if (action === 'like') {
      // Check if already liked
      const existingLike = await prisma.feedLike.findUnique({
        where: {
          userId_feedItemId: {
            userId: session.user.id,
            feedItemId,
          },
        },
      });

      if (existingLike) {
        // Unlike
        await prisma.feedLike.delete({
          where: { id: existingLike.id },
        });

        await prisma.feedItem.update({
          where: { id: feedItemId },
          data: { likeCount: { decrement: 1 } },
        });

        return NextResponse.json({ liked: false });
      } else {
        // Like
        await prisma.feedLike.create({
          data: {
            userId: session.user.id,
            feedItemId,
          },
        });

        await prisma.feedItem.update({
          where: { id: feedItemId },
          data: { likeCount: { increment: 1 } },
        });

        return NextResponse.json({ liked: true });
      }
    }

    if (action === 'comment') {
      if (!feedItemId || !commentBody) {
        return NextResponse.json(
          { error: 'Feed item ID and comment body are required' },
          { status: 400 }
        );
      }

      const comment = await prisma.feedComment.create({
        data: {
          feedItemId,
          body: commentBody,
          authorId: session.user.id,
        },
      });

      await prisma.feedItem.update({
        where: { id: feedItemId },
        data: { commentCount: { increment: 1 } },
      });

      return NextResponse.json(comment);
    }

    if (action === 'likeComment') {
      const existingLike = await prisma.feedLike.findUnique({
        where: {
          userId_commentId: {
            userId: session.user.id,
            commentId,
          },
        },
      });

      if (existingLike) {
        await prisma.feedLike.delete({
          where: { id: existingLike.id },
        });

        await prisma.feedComment.update({
          where: { id: commentId },
          data: { likeCount: { decrement: 1 } },
        });

        return NextResponse.json({ liked: false });
      } else {
        await prisma.feedLike.create({
          data: {
            userId: session.user.id,
            commentId,
          },
        });

        await prisma.feedComment.update({
          where: { id: commentId },
          data: { likeCount: { increment: 1 } },
        });

        return NextResponse.json({ liked: true });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing feed action:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
