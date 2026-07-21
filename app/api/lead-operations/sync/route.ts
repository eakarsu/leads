import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, parseJson } from '@/lib/lead-operations/api';
import { requireOperationsActor, scopedClientId } from '@/lib/lead-operations/auth';
import { queueSyncOperation, rolesAllowedToMutate } from '@/lib/lead-operations/service';
import { queueSyncSchema } from '@/lib/lead-operations/schemas';

export async function GET(request: NextRequest) {
  try {
    const actor = await requireOperationsActor();
    const clientId = scopedClientId(actor, request.nextUrl.searchParams.get('clientId'));
    const data = await prisma.leadSyncOperation.findMany({
      where: { connector: { clientId } },
      include: { connector: { select: { id: true, kind: true, provider: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return NextResponse.json({ data });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireOperationsActor(rolesAllowedToMutate());
    const body = await parseJson(request, queueSyncSchema);
    const clientId = scopedClientId(actor, body.clientId);
    return NextResponse.json(await queueSyncOperation(prisma, { ...body, clientId, actorId: actor.id }), { status: 202 });
  } catch (error) { return apiError(error); }
}
