import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/apiErrors';
import { emitWebhookEvent } from '@/lib/webhooks';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const record = await prisma.opportunity.findUnique({ where: { id } });
    if (!record) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(record);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();

    // Fetch previous stage for event differentiation
    const previous = await prisma.opportunity.findUnique({ where: { id }, select: { stage: true } });
    const record = await prisma.opportunity.update({ where: { id }, data: body });

    // Emit close events when stage transitions to a terminal state
    const newStage = record.stage as string;
    const prevStage = previous?.stage as string | undefined;
    if (newStage !== prevStage) {
      if (newStage === 'CLOSED_WON') {
        emitWebhookEvent('opportunity.won', { opportunityId: id, amount: record.amount });
        emitWebhookEvent('deal.closed', { opportunityId: id, stage: newStage, amount: record.amount });
      } else if (newStage === 'CLOSED_LOST') {
        emitWebhookEvent('opportunity.lost', { opportunityId: id, amount: record.amount });
        emitWebhookEvent('deal.closed', { opportunityId: id, stage: newStage, amount: record.amount });
      } else {
        emitWebhookEvent('deal.updated', { opportunityId: id, stage: newStage });
      }
    }

    return NextResponse.json(record);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await prisma.opportunity.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
