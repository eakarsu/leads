import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, parseJson } from '@/lib/lead-operations/api';
import { requireOperationsActor, scopedClientId } from '@/lib/lead-operations/auth';
import { createConnector } from '@/lib/lead-operations/service';
import { connectorSchema } from '@/lib/lead-operations/schemas';

export async function GET(request: NextRequest) {
  try {
    const actor = await requireOperationsActor();
    const clientId = scopedClientId(actor, request.nextUrl.searchParams.get('clientId'));
    const data = await prisma.leadConnector.findMany({
      where: { clientId },
      select: { id: true, kind: true, provider: true, baseUrl: true, serviceUserId: true, syncDirection: true, enabled: true, cursor: true, lastSucceededAt: true, consecutiveFailures: true, createdAt: true },
      orderBy: [{ kind: 'asc' }, { provider: 'asc' }],
    });
    return NextResponse.json({ data });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireOperationsActor(['ADMIN', 'ACCOUNT_MANAGER']);
    const body = await parseJson(request, connectorSchema);
    const clientId = scopedClientId(actor, body.clientId);
    return NextResponse.json(await createConnector(prisma, { ...body, clientId, actorId: actor.id }), { status: 201 });
  } catch (error) { return apiError(error); }
}
