import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiError, parseJson } from '@/lib/lead-operations/api';
import { requireOperationsActor, scopedClientId } from '@/lib/lead-operations/auth';
import { requestHandoff, rolesAllowedToMutate } from '@/lib/lead-operations/service';

const schema = z.object({ clientId: z.string().uuid().optional(), toOwnerId: z.string().uuid(), targetConnectorId: z.string().uuid().nullable().optional() }).strict();

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireOperationsActor(rolesAllowedToMutate());
    const body = await parseJson(request, schema);
    const clientId = scopedClientId(actor, body.clientId);
    const { id } = await params;
    const handoff = await requestHandoff(prisma, { ...body, clientId, leadId: id, actorId: actor.id });
    return NextResponse.json(handoff, { status: 201 });
  } catch (error) { return apiError(error); }
}
