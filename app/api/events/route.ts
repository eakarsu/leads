import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get('ownerId');
    const contactId = searchParams.get('contactId');
    const opportunityId = searchParams.get('opportunityId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const events = await prisma.event.findMany({
      where: {
        ...(ownerId && { ownerId }),
        ...(contactId && { contactId }),
        ...(opportunityId && { opportunityId }),
        ...(startDate && endDate && {
          startTime: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contact: true,
        opportunity: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json(events);
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
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
    const {
      subject,
      description,
      startTime,
      endTime,
      location,
      isAllDay,
      contactId,
      opportunityId,
    } = body;

    const event = await prisma.event.create({
      data: {
        subject,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location,
        isAllDay: isAllDay || false,
        ownerId: session.user.id,
        contactId,
        opportunityId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contact: true,
        opportunity: true,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
