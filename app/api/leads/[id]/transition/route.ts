import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, parseJson } from '@/lib/lead-operations/api';
import { requireOperationsActor, scopedClientId } from '@/lib/lead-operations/auth';
import { rolesAllowedToMutate, transitionLead } from '@/lib/lead-operations/service';
import { transitionSchema } from '@/lib/lead-operations/schemas';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireOperationsActor(rolesAllowedToMutate());
    const body = await parseJson(request, transitionSchema);
    const clientId = scopedClientId(actor, body.clientId);
    const { id } = await params;
    const result = await transitionLead(prisma, { ...body, clientId, leadId: id, actorId: actor.id });
    return NextResponse.json(result);
  } catch (error) { return apiError(error); }
}
