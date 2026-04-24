import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parsePaginationParams, buildPrismaQuery, buildPaginatedResponse } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  try {
    const paginationParams = parsePaginationParams(req);

    const total = await prisma.marketingEvent.count();

    const events = await prisma.marketingEvent.findMany({
      include: {
        _count: {
          select: { registrations: true, sessions: true },
        },
      },
      ...buildPrismaQuery(paginationParams),
    });

    const now = new Date();
    const stats = {
      totalEvents: events.length,
      upcomingEvents: events.filter((e) => e.status === 'PUBLISHED' && new Date(e.startDateTime) > now).length,
      completedEvents: events.filter((e) => e.status === 'COMPLETED').length,
      totalRegistrations: events.reduce((sum, e) => sum + e.currentAttendees, 0),
    };

    return NextResponse.json(buildPaginatedResponse(events, total, paginationParams, { stats }));
  } catch (error) {
    console.error('Error fetching marketing events:', error);
    return NextResponse.json({ error: 'Failed to fetch marketing events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 400 });
    }

    const event = await prisma.marketingEvent.create({
      data: {
        name: body.name,
        description: body.description || null,
        type: body.type || 'WEBINAR',
        status: 'DRAFT',
        startDateTime: new Date(body.startDateTime),
        endDateTime: new Date(body.endDateTime),
        timezone: body.timezone || 'America/New_York',
        locationType: body.locationType || 'ONLINE',
        venue: body.venue || null,
        city: body.city || null,
        state: body.state || null,
        virtualUrl: body.virtualUrl || null,
        virtualPlatform: body.virtualPlatform || null,
        maxAttendees: body.maxAttendees || null,
        registrationRequired: body.registrationRequired ?? true,
        registrationFee: body.registrationFee || null,
        createdById: admin.id,
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error creating marketing event:', error);
    return NextResponse.json({ error: 'Failed to create marketing event' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const event = await prisma.marketingEvent.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error updating marketing event:', error);
    return NextResponse.json({ error: 'Failed to update marketing event' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    await prisma.marketingEvent.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting marketing event:', error);
    return NextResponse.json({ error: 'Failed to delete marketing event' }, { status: 500 });
  }
}
