import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiError, parseJson } from '@/lib/lead-operations/api';
import { requireOperationsActor, scopedClientId } from '@/lib/lead-operations/auth';
import { addSuppression } from '@/lib/lead-operations/service';

const schema = z.object({
  clientId: z.string().uuid().optional(), channel: z.enum(['EMAIL', 'SMS', 'PHONE']), destination: z.string().trim().min(3).max(254),
  region: z.string().trim().max(20).nullable().optional(), reason: z.string().trim().min(3).max(250),
  sourceSystem: z.string().trim().min(2).max(120), sourceReference: z.string().trim().min(1).max(250), expiresAt: z.coerce.date().nullable().optional(),
}).strict();
export async function POST(request: NextRequest) {
  try {
    const actor = await requireOperationsActor(['ADMIN', 'ACCOUNT_MANAGER']);
    const body = await parseJson(request, schema);
    const clientId = scopedClientId(actor, body.clientId);
    return NextResponse.json(await addSuppression(prisma, { ...body, clientId, actorId: actor.id }), { status: 201 });
  } catch (error) { return apiError(error); }
}
