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
    const objectType = searchParams.get('objectType');

    const where = {
      ...(objectType && { objectType: objectType as any }),
    };

    const total = await prisma.geoLocation.count({ where });

    const geoLocations = await prisma.geoLocation.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(geoLocations, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching geo locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch geo locations' },
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

    const geoLocation = await prisma.geoLocation.create({
      data: body,
    });

    return NextResponse.json(geoLocation, { status: 201 });
  } catch (error: any) {
    console.error('Error creating geo location:', error);
    return NextResponse.json(
      { error: 'Failed to create geo location' },
      { status: 500 }
    );
  }
}
