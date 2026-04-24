import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const calendar = await prisma.bookingCalendar.findUnique({
      where: { publicToken: token },
      select: { id: true, name: true, type: true, duration: true, availability: true },
    });
    if (!calendar) return NextResponse.json({ error: 'Calendar not found' }, { status: 404 });
    return NextResponse.json(calendar);
  } catch (error) {
    console.error('Error fetching public calendar:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const calendar = await prisma.bookingCalendar.findUnique({ where: { publicToken: token } });
    if (!calendar) return NextResponse.json({ error: 'Calendar not found' }, { status: 404 });

    const body = await req.json();
    const { bookerName, bookerEmail, startTime, endTime, notes } = body;
    if (!bookerName || !bookerEmail || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: { calendarId: calendar.id, bookerName, bookerEmail, startTime: new Date(startTime), endTime: new Date(endTime), notes },
    });
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating public booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
