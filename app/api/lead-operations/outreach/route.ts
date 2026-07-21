import { NextRequest, NextResponse } from 'next/server';
import { OutreachState } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { apiError, parseJson } from '@/lib/lead-operations/api';
import { requireOperationsActor, scopedClientId } from '@/lib/lead-operations/auth';
import { createOutreach, rolesAllowedToMutate } from '@/lib/lead-operations/service';
import { outreachSchema } from '@/lib/lead-operations/schemas';

export async function GET(request: NextRequest) {
  try {
    const actor = await requireOperationsActor();
    const clientId = scopedClientId(actor, request.nextUrl.searchParams.get('clientId'));
    const requestedState = request.nextUrl.searchParams.get('state');
    const state = requestedState && Object.values(OutreachState).includes(requestedState as OutreachState)
      ? requestedState as OutreachState
      : undefined;
    const rows = await prisma.governedOutreach.findMany({
      where: { lead: { clientId }, ...(state && { state }) },
      include: { lead: { select: { id: true, fullName: true, email: true, company: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return NextResponse.json({ data: rows });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireOperationsActor(rolesAllowedToMutate());
    const body = await parseJson(request, outreachSchema);
    const clientId = scopedClientId(actor, body.clientId);
    const outreach = await createOutreach(prisma, { ...body, clientId, actorId: actor.id });
    return NextResponse.json(outreach, { status: 201 });
  } catch (error) { return apiError(error); }
}
