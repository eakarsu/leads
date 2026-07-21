import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiError, parseJson } from '@/lib/lead-operations/api';
import { requireOperationsActor, scopedClientId } from '@/lib/lead-operations/auth';
import { cancelOutreach, rolesAllowedToMutate } from '@/lib/lead-operations/service';

const schema = z.object({ clientId: z.string().uuid().optional(), reason: z.string().trim().min(3).max(1000) }).strict();
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireOperationsActor(rolesAllowedToMutate());
    const body = await parseJson(request, schema);
    const clientId = scopedClientId(actor, body.clientId);
    const { id } = await params;
    return NextResponse.json(await cancelOutreach(prisma, { ...body, clientId, outreachId: id, actorId: actor.id }));
  } catch (error) { return apiError(error); }
}
