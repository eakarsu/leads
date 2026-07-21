import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { appendLeadAudit } from '@/lib/lead-operations/audit';
import { apiError, parseJson } from '@/lib/lead-operations/api';
import { requireOperationsActor, scopedClientId } from '@/lib/lead-operations/auth';

const schema = z.object({
  clientId: z.string().uuid().optional(), region: z.string().trim().min(2).max(20), channel: z.enum(['EMAIL']),
  requireConsent: z.boolean().default(true), requireHumanReview: z.boolean().default(true),
  maxPerHour: z.number().int().min(1).max(10000), maxPerDay: z.number().int().min(1).max(100000),
  quietHoursStart: z.number().int().min(0).max(23), quietHoursEnd: z.number().int().min(0).max(23),
  timezone: z.string().trim().min(1).max(100), enabled: z.boolean().default(true),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const actor = await requireOperationsActor();
    const clientId = scopedClientId(actor, request.nextUrl.searchParams.get('clientId'));
    return NextResponse.json({ data: await prisma.outreachPolicy.findMany({ where: { clientId }, orderBy: [{ region: 'asc' }, { channel: 'asc' }] }) });
  } catch (error) { return apiError(error); }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = await requireOperationsActor(['ADMIN', 'ACCOUNT_MANAGER']);
    const body = await parseJson(request, schema);
    const clientId = scopedClientId(actor, body.clientId);
    const policy = await prisma.$transaction(async (tx) => {
      const result = await tx.outreachPolicy.upsert({
        where: { clientId_region_channel: { clientId, region: body.region.toUpperCase(), channel: body.channel } },
        update: { ...body, clientId: undefined, region: body.region.toUpperCase() },
        create: { ...body, clientId, region: body.region.toUpperCase() },
      });
      await appendLeadAudit(tx, {
        clientId, entityType: 'OUTREACH_POLICY', entityId: result.id, actorId: actor.id, action: 'OUTREACH_POLICY_SAVED',
        payload: { region: result.region, channel: result.channel, requireConsent: result.requireConsent, requireHumanReview: result.requireHumanReview, maxPerHour: result.maxPerHour, maxPerDay: result.maxPerDay, quietHoursStart: result.quietHoursStart, quietHoursEnd: result.quietHoursEnd, timezone: result.timezone, enabled: result.enabled },
      });
      return result;
    });
    return NextResponse.json(policy);
  } catch (error) { return apiError(error); }
}
