import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 400 });
    }

    const account = await prisma.emailSyncAccount.create({
      data: {
        userId: admin.id,
        provider: body.provider || 'GMAIL',
        email: body.email,
        syncEnabled: true,
        syncDirection: body.syncDirection || 'BOTH',
        syncFolders: body.syncFolders || ['INBOX', 'SENT'],
        syncStatus: 'OK',
        lastSyncAt: new Date(),
      },
    });

    return NextResponse.json({ account });
  } catch (error) {
    console.error('Error creating email sync account:', error);
    return NextResponse.json({ error: 'Failed to create email sync account' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, ...updateData } = body;

    if (action === 'sync_now') {
      const account = await prisma.emailSyncAccount.update({
        where: { id },
        data: {
          lastSyncAt: new Date(),
          syncStatus: 'OK',
        },
      });
      return NextResponse.json({ account });
    }

    const account = await prisma.emailSyncAccount.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ account });
  } catch (error) {
    console.error('Error updating email sync account:', error);
    return NextResponse.json({ error: 'Failed to update email sync account' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    await prisma.emailSyncAccount.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting email sync account:', error);
    return NextResponse.json({ error: 'Failed to delete email sync account' }, { status: 500 });
  }
}
