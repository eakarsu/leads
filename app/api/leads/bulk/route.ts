import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids, updates } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid ids array' }, { status: 400 });
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Invalid updates object' }, { status: 400 });
    }

    // Build update data object
    const updateData: any = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.ownerId) updateData.ownerId = updates.ownerId;
    if (updates.campaignId !== undefined) updateData.campaignId = updates.campaignId;
    if (updates.tags) updateData.tags = updates.tags;

    const result = await prisma.lead.updateMany({
      where: {
        id: { in: ids },
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
    });
  } catch (error: any) {
    console.error('Error bulk updating leads:', error);
    return NextResponse.json(
      { error: 'Failed to bulk update leads' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid ids array' }, { status: 400 });
    }

    const result = await prisma.lead.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
    });
  } catch (error: any) {
    console.error('Error bulk deleting leads:', error);
    return NextResponse.json(
      { error: 'Failed to bulk delete leads' },
      { status: 500 }
    );
  }
}
