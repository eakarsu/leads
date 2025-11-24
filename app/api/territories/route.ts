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
    const clientId = searchParams.get('clientId');
    const isActive = searchParams.get('isActive');

    const territories = await prisma.territory.findMany({
      where: {
        ...(clientId && { clientId }),
        ...(isActive !== null && { isActive: isActive === 'true' }),
      },
      include: {
        client: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(territories);
  } catch (error: any) {
    console.error('Error fetching territories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch territories' },
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
      clientId,
      name,
      description,
      regions,
      isActive,
    } = body;

    const territory = await prisma.territory.create({
      data: {
        clientId,
        name,
        description,
        regions,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        client: true,
      },
    });

    return NextResponse.json(territory, { status: 201 });
  } catch (error: any) {
    console.error('Error creating territory:', error);
    return NextResponse.json(
      { error: 'Failed to create territory' },
      { status: 500 }
    );
  }
}
