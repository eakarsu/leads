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
    const ownerId = searchParams.get('ownerId');
    const type = searchParams.get('type');

    const where = {
      ...(ownerId && { ownerId }),
      ...(type && { type: type as any }),
    };

    const total = await prisma.bookingCalendar.count({ where });

    const calendars = await prisma.bookingCalendar.findMany({
      where,
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(calendars, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching booking calendars:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking calendars' },
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

    const calendar = await prisma.bookingCalendar.create({
      data: {
        ...body,
        ownerId: body.ownerId || session.user.id,
      },
    });

    return NextResponse.json(calendar, { status: 201 });
  } catch (error: any) {
    console.error('Error creating booking calendar:', error);
    return NextResponse.json(
      { error: 'Failed to create booking calendar' },
      { status: 500 }
    );
  }
}
