import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { LeadOperationsError } from './errors';
import { destinationHash } from './identity';
import { recordConsent } from './service';

type TokenPayload = { outreachId: string; expiresAt: number };

function tokenSecret(): string {
  const secret = process.env.OUTREACH_OPT_OUT_SECRET;
  if (!secret || secret.length < 32) {
    throw new LeadOperationsError('OPT_OUT_SECRET_MISSING', 'OUTREACH_OPT_OUT_SECRET must contain at least 32 characters', 503);
  }
  return secret;
}

export function createOptOutToken(outreachId: string, expiresAt = Date.now() + 90 * 24 * 60 * 60 * 1000): string {
  const encoded = Buffer.from(JSON.stringify({ outreachId, expiresAt } satisfies TokenPayload)).toString('base64url');
  const signature = crypto.createHmac('sha256', tokenSecret()).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyOptOutToken(token: string): TokenPayload {
  const [encoded, supplied] = token.split('.');
  if (!encoded || !supplied) throw new LeadOperationsError('INVALID_OPT_OUT_TOKEN', 'Opt-out token is invalid', 400);
  const expected = crypto.createHmac('sha256', tokenSecret()).update(encoded).digest();
  let actual: Buffer;
  try { actual = Buffer.from(supplied, 'base64url'); } catch { throw new LeadOperationsError('INVALID_OPT_OUT_TOKEN', 'Opt-out token is invalid', 400); }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    throw new LeadOperationsError('INVALID_OPT_OUT_TOKEN', 'Opt-out token is invalid', 400);
  }
  let payload: TokenPayload;
  try { payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as TokenPayload; }
  catch { throw new LeadOperationsError('INVALID_OPT_OUT_TOKEN', 'Opt-out token is invalid', 400); }
  if (!payload.outreachId || !Number.isFinite(payload.expiresAt) || payload.expiresAt < Date.now()) {
    throw new LeadOperationsError('EXPIRED_OPT_OUT_TOKEN', 'Opt-out token has expired', 400);
  }
  return payload;
}

export async function describeOptOut(db: PrismaClient, token: string) {
  const payload = verifyOptOutToken(token);
  const outreach = await db.governedOutreach.findUnique({
    where: { id: payload.outreachId },
    include: { lead: { select: { id: true, clientId: true, email: true, phone: true } } },
  });
  if (!outreach) throw new LeadOperationsError('OUTREACH_NOT_FOUND', 'Outreach not found', 404);
  return { channel: outreach.channel, purpose: outreach.purpose, clientId: outreach.lead.clientId };
}

export async function applyOptOut(db: PrismaClient, token: string) {
  const payload = verifyOptOutToken(token);
  const outreach = await db.governedOutreach.findUnique({
    where: { id: payload.outreachId },
    include: { lead: true },
  });
  if (!outreach) throw new LeadOperationsError('OUTREACH_NOT_FOUND', 'Outreach not found', 404);
  const destination = outreach.channel === 'EMAIL' ? outreach.lead.email : outreach.lead.phone;
  if (!destination) throw new LeadOperationsError('DESTINATION_MISSING', 'Outreach destination no longer exists', 409);
  const existing = await db.leadConsent.findFirst({
    where: {
      leadId: outreach.leadId,
      channel: outreach.channel,
      purpose: outreach.purpose,
      state: 'REVOKED',
      sourceSystem: 'ONE_CLICK_OPT_OUT',
      sourceReference: outreach.id,
    },
    orderBy: { createdAt: 'asc' },
  });
  if (existing) return existing;
  return recordConsent(db, {
    clientId: outreach.lead.clientId,
    leadId: outreach.leadId,
    actorId: 'PUBLIC_OPT_OUT',
    channel: outreach.channel,
    purpose: outreach.purpose,
    region: outreach.region,
    state: 'REVOKED',
    sourceSystem: 'ONE_CLICK_OPT_OUT',
    sourceReference: outreach.id,
    evidence: { outreachId: outreach.id, destinationHash: destinationHash(outreach.channel, destination) },
  });
}
