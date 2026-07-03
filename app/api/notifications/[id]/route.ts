import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { NotificationType, Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/apiErrors';

function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === 'string' && Object.values(NotificationType).includes(value as NotificationType);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const record = await prisma.notification.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!record) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(record);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json() as Record<string, unknown>;
    const existing = await prisma.notification.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const data: Prisma.NotificationUpdateInput = {};
    if (typeof body.title === 'string') data.title = body.title;
    if (typeof body.message === 'string') data.message = body.message;
    if (isNotificationType(body.type)) data.type = body.type;
    if (typeof body.link === 'string' || body.link === null) data.link = body.link;
    if (typeof body.isRead === 'boolean') data.isRead = body.isRead;
    if ('metadata' in body) data.metadata = body.metadata as Prisma.InputJsonValue;

    const record = await prisma.notification.update({ where: { id }, data });
    return NextResponse.json(record);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.notification.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const record = await prisma.notification.update({
      where: { id },
      data: {
        isRead: typeof body.isRead === 'boolean' ? body.isRead : true,
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const existing = await prisma.notification.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await prisma.notification.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
