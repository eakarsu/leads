import { NextRequest, NextResponse } from 'next/server';
import { GovernedLeadStage } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { apiError, parseJson } from '@/lib/lead-operations/api';
import { requireOperationsActor, scopedClientId } from '@/lib/lead-operations/auth';
import { captureLead } from '@/lib/lead-operations/service';
import { captureLeadSchema } from '@/lib/lead-operations/schemas';

export async function GET(request: NextRequest) {
  try {
    const actor = await requireOperationsActor();
    const search = request.nextUrl.searchParams;
    const clientId = scopedClientId(actor, search.get('clientId'));
    const page = Math.max(1, Number(search.get('page') || 1));
    const pageSize = Math.min(100, Math.max(1, Number(search.get('pageSize') || 25)));
    const requestedStage = search.get('stage');
    const stage = requestedStage && Object.values(GovernedLeadStage).includes(requestedStage as GovernedLeadStage)
      ? requestedStage as GovernedLeadStage
      : undefined;
    const where = { clientId, ...(stage && { governance: { is: { stage } } }) };
    const [totalItems, data] = await prisma.$transaction([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        include: {
          campaign: { select: { id: true, name: true } },
          client: { select: { id: true, name: true, lifecycleStage: true } },
          governance: true,
          consents: { orderBy: { effectiveAt: 'desc' }, take: 5 },
          _count: { select: { activities: true, outreach: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return NextResponse.json({ data, pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireOperationsActor();
    const body = await parseJson(request, captureLeadSchema);
    const clientId = scopedClientId(actor, body.clientId);
    const result = await captureLead(prisma, { ...body, clientId, actorId: actor.id });
    return NextResponse.json(result, { status: result.duplicate ? 200 : 201 });
  } catch (error) { return apiError(error); }
}
