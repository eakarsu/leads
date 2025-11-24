import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = await prisma.email.findUnique({
      where: { id: params.id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(email);
  } catch (error: any) {
    console.error('Error fetching email:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      toAddress,
      ccAddress,
      bccAddress,
      subject,
      body: emailBody,
      status,
      scheduledAt,
      sentAt,
      openedAt,
      clickedAt,
      bouncedAt,
    } = body;

    const email = await prisma.email.update({
      where: { id: params.id },
      data: {
        ...(toAddress !== undefined && { toAddress }),
        ...(ccAddress !== undefined && { ccAddress }),
        ...(bccAddress !== undefined && { bccAddress }),
        ...(subject !== undefined && { subject }),
        ...(emailBody !== undefined && { body: emailBody }),
        ...(status !== undefined && { status }),
        ...(scheduledAt !== undefined && {
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        }),
        ...(sentAt !== undefined && {
          sentAt: sentAt ? new Date(sentAt) : null,
        }),
        ...(openedAt !== undefined && {
          openedAt: openedAt ? new Date(openedAt) : null,
        }),
        ...(clickedAt !== undefined && {
          clickedAt: clickedAt ? new Date(clickedAt) : null,
        }),
        ...(bouncedAt !== undefined && {
          bouncedAt: bouncedAt ? new Date(bouncedAt) : null,
        }),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(email);
  } catch (error: any) {
    console.error('Error updating email:', error);
    return NextResponse.json(
      { error: 'Failed to update email' },
      { status: 500 }
    );
  }
}
