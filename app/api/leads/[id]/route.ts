import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiError, parseJson } from '@/lib/lead-operations/api';
import { requireOperationsActor, scopedClientId } from '@/lib/lead-operations/auth';
import { LeadOperationsError } from '@/lib/lead-operations/errors';
import { rolesAllowedToMutate, updateLeadProfile } from '@/lib/lead-operations/service';

const updateSchema = z.object({
  clientId: z.string().uuid().optional(),
  expectedVersion: z.number().int().positive(),
  fullName: z.string().trim().min(2).max(160).optional(),
  company: z.string().trim().max(200).nullable().optional(),
  title: z.string().trim().max(200).nullable().optional(),
  email: z.string().trim().max(254).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
}).strict();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireOperationsActor();
    const clientId = scopedClientId(actor, request.nextUrl.searchParams.get('clientId'));
    const { id } = await params;
    const lead = await prisma.lead.findFirst({
      where: { id, clientId },
      include: {
        governance: true,
        consents: { orderBy: { effectiveAt: 'desc' } },
        outreach: { orderBy: { createdAt: 'desc' } },
        syncRecords: { include: { connector: { select: { id: true, kind: true, provider: true } } } },
        attributions: { orderBy: { convertedAt: 'desc' } },
        activities: { orderBy: { timestamp: 'desc' }, take: 50 },
      },
    });
    if (!lead) throw new LeadOperationsError('LEAD_NOT_FOUND', 'Lead not found', 404);
    return NextResponse.json(lead);
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireOperationsActor(rolesAllowedToMutate());
    const body = await parseJson(request, updateSchema);
    const clientId = scopedClientId(actor, body.clientId);
    const { id } = await params;
    const lead = await updateLeadProfile(prisma, { ...body, clientId, leadId: id, actorId: actor.id });
    return NextResponse.json(lead);
  } catch (error) { return apiError(error); }
}

export async function DELETE() {
  return NextResponse.json({ error: 'ARCHIVE_REQUIRED', message: 'Leads are retained for audit; transition to DISQUALIFIED instead' }, { status: 405 });
}
