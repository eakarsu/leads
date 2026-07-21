import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiError, parseJson } from '@/lib/lead-operations/api';
import { requireOperationsActor, scopedClientId } from '@/lib/lead-operations/auth';
import { recordConversion, rolesAllowedToMutate } from '@/lib/lead-operations/service';

const schema = z.object({
  clientId: z.string().uuid().optional(), opportunityId: z.string().uuid(), model: z.string().trim().min(2).max(80),
  touchpoints: z.array(z.record(z.string(), z.unknown())).max(500),
}).strict();
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireOperationsActor(rolesAllowedToMutate());
    const body = await parseJson(request, schema);
    const clientId = scopedClientId(actor, body.clientId);
    const { id } = await params;
    return NextResponse.json(await recordConversion(prisma, { ...body, clientId, leadId: id, actorId: actor.id }), { status: 201 });
  } catch (error) { return apiError(error); }
}
