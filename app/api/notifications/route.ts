import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { NotificationType, Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parsePaginationParams, buildPrismaQuery, buildPaginatedResponse } from '@/lib/pagination';

function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === 'string' && Object.values(NotificationType).includes(value as NotificationType);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paginationParams = parsePaginationParams(req);

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit'));
    if (Number.isFinite(limit) && limit > 0) {
      paginationParams.pageSize = Math.min(100, Math.max(1, limit));
    }
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const read = searchParams.get('read');
    const type = searchParams.get('type');
    const search = searchParams.get('search')?.trim();

    const where: Prisma.NotificationWhereInput = {
      userId: session.user.id,
      ...(unreadOnly && { isRead: false }),
    };

    if (read === 'true') where.isRead = true;
    if (read === 'false') where.isRead = false;
    if (isNotificationType(type)) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.notification.count({ where });

    const notifications = await prisma.notification.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(notifications, total, paginationParams));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
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

    const body = await req.json() as Record<string, unknown>;
    const title = String(body.title || '').trim();
    const message = String(body.message || '').trim();
    const link = typeof body.link === 'string' && body.link.trim() ? body.link.trim() : null;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId: typeof body.userId === 'string' && body.userId ? body.userId : session.user.id,
        type: isNotificationType(body.type) ? body.type : NotificationType.SYSTEM,
        title,
        message,
        link,
        metadata: body.metadata === undefined ? undefined : body.metadata as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const { markAllAsRead } = body;

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
