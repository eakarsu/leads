import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const territory = await prisma.territory.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!territory) {
      return NextResponse.json(
        { error: 'Territory not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(territory);
  } catch (error: any) {
    console.error('Error fetching territory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch territory' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      name,
      description,
      regions,
      isActive,
    } = body;

    const territory = await prisma.territory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(regions !== undefined && { regions }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        client: true,
      },
    });

    return NextResponse.json(territory);
  } catch (error: any) {
    console.error('Error updating territory:', error);
    return NextResponse.json(
      { error: 'Failed to update territory' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.territory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting territory:', error);
    return NextResponse.json(
      { error: 'Failed to delete territory' },
      { status: 500 }
    );
  }
}
