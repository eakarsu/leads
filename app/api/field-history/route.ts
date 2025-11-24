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
    const objectType = searchParams.get('objectType');
    const objectId = searchParams.get('objectId');
    const fieldName = searchParams.get('fieldName');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (objectType) where.objectType = objectType;
    if (objectId) where.objectId = objectId;
    if (fieldName) where.fieldName = fieldName;

    const history = await prisma.fieldHistory.findMany({
      where,
      orderBy: { changedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Error fetching field history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch field history' },
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
    const { objectType, objectId, fieldName, oldValue, newValue } = body;

    if (!objectType || !objectId || !fieldName) {
      return NextResponse.json(
        { error: 'objectType, objectId, and fieldName are required' },
        { status: 400 }
      );
    }

    const fieldHistory = await prisma.fieldHistory.create({
      data: {
        objectType,
        objectId,
        fieldName,
        oldValue: oldValue?.toString() || null,
        newValue: newValue?.toString() || null,
        changedBy: session.user.id,
      },
    });

    return NextResponse.json(fieldHistory, { status: 201 });
  } catch (error: any) {
    console.error('Error creating field history:', error);
    return NextResponse.json(
      { error: 'Failed to create field history' },
      { status: 500 }
    );
  }
}
