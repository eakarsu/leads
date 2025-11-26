import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const journeys = await prisma.journey.findMany({
      include: {
        _count: {
          select: { steps: true, enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      totalJourneys: journeys.length,
      activeJourneys: journeys.filter((j) => j.status === 'ACTIVE').length,
      pausedJourneys: journeys.filter((j) => j.status === 'PAUSED').length,
      totalEnrollments: journeys.reduce((sum, j) => sum + j.totalEntered, 0),
      totalConversions: journeys.reduce((sum, j) => sum + j.totalConverted, 0),
    };

    return NextResponse.json({ journeys, stats });
  } catch (error) {
    console.error('Error fetching journeys:', error);
    return NextResponse.json({ error: 'Failed to fetch journeys' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 400 });
    }

    const journey = await prisma.journey.create({
      data: {
        name: body.name,
        description: body.description || null,
        status: 'DRAFT',
        type: body.type || 'NURTURE',
        triggerType: body.triggerType || 'MANUAL',
        createdById: admin.id,
      },
    });

    return NextResponse.json({ journey });
  } catch (error) {
    console.error('Error creating journey:', error);
    return NextResponse.json({ error: 'Failed to create journey' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const journey = await prisma.journey.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ journey });
  } catch (error) {
    console.error('Error updating journey:', error);
    return NextResponse.json({ error: 'Failed to update journey' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Journey ID required' }, { status: 400 });
    }

    await prisma.journey.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting journey:', error);
    return NextResponse.json({ error: 'Failed to delete journey' }, { status: 500 });
  }
}
