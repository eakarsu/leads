import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const surveys = await prisma.survey.findMany({
      include: {
        _count: {
          select: { questions: true, responses: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      totalSurveys: surveys.length,
      activeSurveys: surveys.filter((s) => s.status === 'ACTIVE').length,
      closedSurveys: surveys.filter((s) => s.status === 'CLOSED').length,
      totalResponses: surveys.reduce((sum, s) => sum + s.totalResponses, 0),
    };

    return NextResponse.json({ surveys, stats });
  } catch (error) {
    console.error('Error fetching surveys:', error);
    return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 400 });
    }

    const survey = await prisma.survey.create({
      data: {
        name: body.name,
        description: body.description || null,
        status: 'DRAFT',
        type: body.type || 'SATISFACTION',
        isAnonymous: body.isAnonymous || false,
        showProgressBar: body.showProgressBar ?? true,
        thankYouMessage: body.thankYouMessage || 'Thank you for your feedback!',
        createdById: admin.id,
      },
    });

    return NextResponse.json({ survey });
  } catch (error) {
    console.error('Error creating survey:', error);
    return NextResponse.json({ error: 'Failed to create survey' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const survey = await prisma.survey.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ survey });
  } catch (error) {
    console.error('Error updating survey:', error);
    return NextResponse.json({ error: 'Failed to update survey' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Survey ID required' }, { status: 400 });
    }

    await prisma.survey.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting survey:', error);
    return NextResponse.json({ error: 'Failed to delete survey' }, { status: 500 });
  }
}
