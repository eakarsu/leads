import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List calendar events
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const relatedToId = searchParams.get('relatedToId');
    const relatedToType = searchParams.get('relatedToType');

    const whereClause: any = {
      OR: [
        { ownerId: session.user.id },
        {
          attendees: {
            some: {
              userId: session.user.id,
            },
          },
        },
        { isPrivate: false },
      ],
    };

    if (startDate && endDate) {
      whereClause.startDateTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (relatedToId && relatedToType) {
      whereClause.relatedToId = relatedToId;
      whereClause.relatedToType = relatedToType;
    }

    const events = await prisma.calendarEvent.findMany({
      where: whereClause,
      include: {
        attendees: true,
      },
      orderBy: { startDateTime: 'asc' },
    });

    // Get upcoming events for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEvents = events.filter(e => {
      const eventDate = new Date(e.startDateTime);
      return eventDate >= today && eventDate < tomorrow;
    });

    return NextResponse.json({
      events,
      todayEvents,
      stats: {
        totalEvents: events.length,
        todayCount: todayEvents.length,
        upcomingCount: events.filter(e => new Date(e.startDateTime) > new Date()).length,
      },
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new calendar event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      subject,
      description,
      location,
      startDateTime,
      endDateTime,
      isAllDay,
      recurrenceRule,
      recurrenceEndDate,
      reminderMinutes,
      relatedToId,
      relatedToType,
      isPrivate,
      attendees,
    } = body;

    const event = await prisma.calendarEvent.create({
      data: {
        subject,
        description,
        location,
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime),
        isAllDay: isAllDay || false,
        recurrenceRule,
        recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
        reminderMinutes: reminderMinutes || 15,
        relatedToId,
        relatedToType,
        isPrivate: isPrivate || false,
        ownerId: session.user.id,
      },
    });

    // Add attendees
    if (attendees && attendees.length > 0) {
      for (const attendee of attendees) {
        await prisma.eventAttendee.create({
          data: {
            eventId: event.id,
            userId: attendee.userId,
            email: attendee.email || '',
            name: attendee.name,
            status: 'PENDING',
            isRequired: attendee.isRequired !== false,
          },
        });
      }
    }

    const createdEvent = await prisma.calendarEvent.findUnique({
      where: { id: event.id },
      include: {
        attendees: true,
      },
    });

    return NextResponse.json(createdEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a calendar event
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      subject,
      description,
      location,
      startDateTime,
      endDateTime,
      isAllDay,
      recurrenceRule,
      recurrenceEndDate,
      reminderMinutes,
      isPrivate,
      attendees,
      attendeeResponse,
    } = body;

    // Handle attendee response (accept/decline)
    if (attendeeResponse) {
      await prisma.eventAttendee.updateMany({
        where: {
          eventId: id,
          userId: session.user.id,
        },
        data: {
          status: attendeeResponse,
          respondedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true });
    }

    // Update event
    const event = await prisma.calendarEvent.update({
      where: { id },
      data: {
        subject,
        description,
        location,
        startDateTime: startDateTime ? new Date(startDateTime) : undefined,
        endDateTime: endDateTime ? new Date(endDateTime) : undefined,
        isAllDay,
        recurrenceRule,
        recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
        reminderMinutes,
        isPrivate,
      },
    });

    // Update attendees if provided
    if (attendees) {
      // Remove existing attendees
      await prisma.eventAttendee.deleteMany({
        where: { eventId: id },
      });

      // Add new attendees
      for (const attendee of attendees) {
        await prisma.eventAttendee.create({
          data: {
            eventId: id,
            userId: attendee.userId,
            email: attendee.email || '',
            name: attendee.name,
            status: 'PENDING',
            isRequired: attendee.isRequired !== false,
          },
        });
      }
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a calendar event
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    // Delete attendees first
    await prisma.eventAttendee.deleteMany({
      where: { eventId: id },
    });

    // Delete event
    await prisma.calendarEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
