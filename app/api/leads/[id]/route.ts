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
    const record = await prisma.lead.findUnique({ where: { id } });
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
    const record = await prisma.lead.update({ where: { id }, data: body });

    // Invalidate the 24-hour lead score cache whenever lead data changes
    await prisma.aIPrediction.deleteMany({
      where: {
        objectType: 'Lead',
        objectId: id,
        predictionType: 'LEAD_SCORE',
      },
    });

    // Fire webhook event (non-blocking)
    emitWebhookEvent('lead.updated', { leadId: record.id, status: record.status });

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

    // Clear cached lead score before deleting
    await prisma.aIPrediction.deleteMany({
      where: { objectType: 'Lead', objectId: id, predictionType: 'LEAD_SCORE' },
    });

    await prisma.lead.delete({ where: { id } });

    // Fire webhook event (non-blocking)
    emitWebhookEvent('lead.deleted', { leadId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
