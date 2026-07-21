import {
  LeadConnector,
  LeadSyncOperation,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { appendLeadAudit } from './audit';
import { LeadOperationsError, asLeadOperationsError } from './errors';
import { payloadHash } from './identity';
import { createOptOutToken } from './opt-out';
import { postConnector } from './http';
import { addSuppression, captureLead, recordConsent, updateLeadProfile } from './service';

export type DeliveryResult = { receipt: string };
export type OutreachDelivery = {
  idempotencyKey: string;
  to: string;
  subject: string;
  html: string;
};
export interface OutreachProvider {
  send(input: OutreachDelivery): Promise<DeliveryResult>;
}

export class ResendOutreachProvider implements OutreachProvider {
  async send(input: OutreachDelivery): Promise<DeliveryResult> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) {
      throw new LeadOperationsError('EMAIL_PROVIDER_NOT_CONFIGURED', 'RESEND_API_KEY and EMAIL_FROM are required', 503, true);
    }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        'idempotency-key': input.idempotencyKey,
        'user-agent': 'LeadOperationsOutreach/1.0',
      },
      body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html }),
    });
    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > 64 * 1024) throw new LeadOperationsError('EMAIL_PROVIDER_RESPONSE_TOO_LARGE', 'Email provider response was too large', 502, true);
    const body = (await response.text()).slice(0, 64 * 1024);
    if (!response.ok) {
      throw new LeadOperationsError(
        `EMAIL_PROVIDER_HTTP_${response.status}`,
        'Email provider rejected the message',
        502,
        response.status === 408 || response.status === 429 || response.status >= 500,
      );
    }
    try {
      const parsed = JSON.parse(body) as { id?: unknown };
      if (!parsed.id) throw new Error('missing id');
      return { receipt: String(parsed.id) };
    } catch {
      throw new LeadOperationsError('EMAIL_PROVIDER_INVALID_RESPONSE', 'Email provider returned no receipt', 502, true);
    }
  }
}

function retryAt(attempts: number, now = new Date()): Date {
  const delaySeconds = Math.min(3600, 15 * (2 ** Math.max(0, attempts - 1)));
  return new Date(now.getTime() + delaySeconds * 1000);
}

function applicationUrl(): URL {
  const raw = process.env.PUBLIC_APP_URL;
  if (!raw) throw new LeadOperationsError('PUBLIC_APP_URL_MISSING', 'PUBLIC_APP_URL is required for opt-out links', 503, true);
  let url: URL;
  try { url = new URL(raw); } catch { throw new LeadOperationsError('PUBLIC_APP_URL_INVALID', 'PUBLIC_APP_URL is invalid', 503); }
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
    throw new LeadOperationsError('PUBLIC_APP_URL_INVALID', 'PUBLIC_APP_URL must use HTTPS in production', 503);
  }
  return url;
}

async function claimOutreach(db: PrismaClient, workerId: string, now = new Date()) {
  const leaseUntil = new Date(now.getTime() + 60_000);
  const rows = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    WITH candidate AS (
      SELECT "id"
      FROM "governed_outreach"
      WHERE (
        ("state" IN ('APPROVED', 'RETRY') AND COALESCE("nextAttemptAt", "scheduledAt", "createdAt") <= ${now})
        OR ("state" = 'SENDING' AND "leaseUntil" < ${now})
      )
      ORDER BY COALESCE("nextAttemptAt", "scheduledAt", "createdAt"), "createdAt"
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    UPDATE "governed_outreach" AS outreach
    SET "state" = 'SENDING'::"OutreachState",
        "leaseOwner" = ${workerId},
        "leaseUntil" = ${leaseUntil},
        "updatedAt" = ${now}
    FROM candidate
    WHERE outreach."id" = candidate."id"
    RETURNING outreach."id"
  `);
  return rows[0]?.id || null;
}

export async function processOneOutreach(
  db: PrismaClient,
  workerId: string,
  provider: OutreachProvider = new ResendOutreachProvider(),
  now = new Date(),
): Promise<'idle' | 'sent' | 'retry' | 'blocked' | 'dead-letter'> {
  if (!/^[A-Za-z0-9_.:-]{3,100}$/.test(workerId)) throw new LeadOperationsError('INVALID_WORKER_ID', 'Worker ID is invalid');
  const outreachId = await claimOutreach(db, workerId, now);
  if (!outreachId) return 'idle';

  const outreach = await db.governedOutreach.findUnique({
    where: { id: outreachId },
    include: { lead: true },
  });
  if (!outreach || outreach.leaseOwner !== workerId || outreach.state !== 'SENDING') return 'idle';

  const controls = await db.$transaction((tx) => import('./service').then(({ evaluateOutreachControls }) => evaluateOutreachControls(tx, outreach.id, now)));
  if (!controls.allowed) {
    const transient = controls.reasons.every((reason) => ['HOURLY_RATE_LIMIT', 'DAILY_RATE_LIMIT', 'QUIET_HOURS'].includes(reason));
    await db.$transaction(async (tx) => {
      const updated = await tx.governedOutreach.updateMany({
        where: { id: outreach.id, state: 'SENDING', leaseOwner: workerId },
        data: {
          state: transient ? 'RETRY' : 'BLOCKED',
          nextAttemptAt: transient ? new Date(now.getTime() + 15 * 60 * 1000) : null,
          lastErrorCode: controls.reasons.join(','),
          leaseOwner: null,
          leaseUntil: null,
        },
      });
      if (updated.count === 1) {
        await appendLeadAudit(tx, {
          clientId: outreach.lead.clientId,
          entityType: 'OUTREACH',
          entityId: outreach.id,
          actorId: workerId,
          action: transient ? 'OUTREACH_DEFERRED_BY_POLICY' : 'OUTREACH_BLOCKED_BY_POLICY',
          payload: { reasons: controls.reasons },
        });
      }
    });
    return transient ? 'retry' : 'blocked';
  }

  const destination = outreach.channel === 'EMAIL' ? outreach.lead.email : outreach.lead.phone;
  if (!destination || outreach.channel !== 'EMAIL') {
    await db.governedOutreach.updateMany({
      where: { id: outreach.id, state: 'SENDING', leaseOwner: workerId },
      data: { state: 'BLOCKED', lastErrorCode: 'UNSUPPORTED_OR_MISSING_DESTINATION', leaseOwner: null, leaseUntil: null },
    });
    return 'blocked';
  }

  try {
    const token = createOptOutToken(outreach.id);
    const optOutUrl = new URL(`/opt-out/${encodeURIComponent(token)}`, applicationUrl()).toString();
    const html = `${outreach.body}\n<hr><p style="font-size:12px"><a href="${optOutUrl}">Unsubscribe</a></p>`;
    const delivered = await provider.send({
      idempotencyKey: outreach.idempotencyKey,
      to: destination,
      subject: outreach.subject || '(no subject)',
      html,
    });
    await db.$transaction(async (tx) => {
      const updated = await tx.governedOutreach.updateMany({
        where: { id: outreach.id, state: 'SENDING', leaseOwner: workerId },
        data: {
          state: 'SENT',
          provider: 'RESEND',
          providerReceipt: delivered.receipt,
          sentAt: now,
          attempts: { increment: 1 },
          nextAttemptAt: null,
          lastErrorCode: null,
          leaseOwner: null,
          leaseUntil: null,
        },
      });
      if (updated.count !== 1) throw new LeadOperationsError('STALE_WORKER_LEASE', 'Worker lease is no longer current', 409);
      await tx.leadGovernance.updateMany({
        where: { leadId: outreach.leadId, stage: 'OUTREACH_APPROVED' },
        data: { stage: 'CONTACTED', version: { increment: 1 }, lastTransitionAt: now },
      });
      await appendLeadAudit(tx, {
        clientId: outreach.lead.clientId,
        entityType: 'OUTREACH',
        entityId: outreach.id,
        actorId: workerId,
        action: 'OUTREACH_SENT',
        payload: { providerReceipt: delivered.receipt, attempt: outreach.attempts + 1 },
      });
    });
    return 'sent';
  } catch (error) {
    const failure = asLeadOperationsError(error);
    const attempts = outreach.attempts + 1;
    const retryable = failure.retryable && attempts < outreach.maxAttempts;
    await db.$transaction(async (tx) => {
      const updated = await tx.governedOutreach.updateMany({
        where: { id: outreach.id, state: 'SENDING', leaseOwner: workerId },
        data: {
          state: retryable ? 'RETRY' : 'DEAD_LETTER',
          attempts,
          nextAttemptAt: retryable ? retryAt(attempts, now) : null,
          lastErrorCode: failure.code,
          leaseOwner: null,
          leaseUntil: null,
        },
      });
      if (updated.count === 1) {
        await appendLeadAudit(tx, {
          clientId: outreach.lead.clientId,
          entityType: 'OUTREACH',
          entityId: outreach.id,
          actorId: workerId,
          action: retryable ? 'OUTREACH_RETRY_SCHEDULED' : 'OUTREACH_DEAD_LETTERED',
          payload: { errorCode: failure.code, attempts },
        });
      }
    });
    return retryable ? 'retry' : 'dead-letter';
  }
}

async function claimSyncOperation(db: PrismaClient, workerId: string, now = new Date()) {
  const leaseUntil = new Date(now.getTime() + 60_000);
  const rows = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    WITH candidate AS (
      SELECT "id"
      FROM "lead_sync_operations"
      WHERE (
        ("status" IN ('PENDING', 'RETRY') AND "nextAttemptAt" <= ${now})
        OR ("status" = 'LEASED' AND "leaseUntil" < ${now})
      )
      ORDER BY "nextAttemptAt", "createdAt"
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    UPDATE "lead_sync_operations" AS operation
    SET "status" = 'LEASED'::"SyncOperationStatus",
        "leaseOwner" = ${workerId},
        "leaseUntil" = ${leaseUntil},
        "updatedAt" = ${now}
    FROM candidate
    WHERE operation."id" = candidate."id"
    RETURNING operation."id"
  `);
  return rows[0]?.id || null;
}

type ClaimedSync = LeadSyncOperation & { connector: LeadConnector };

type SyncPayload = Record<string, unknown>;
type ConsentValue = 'PENDING' | 'GRANTED' | 'DENIED' | 'REVOKED' | 'EXPIRED';

function objectPayload(operation: ClaimedSync): SyncPayload {
  if (!operation.payload || Array.isArray(operation.payload) || typeof operation.payload !== 'object') {
    throw new LeadOperationsError('INVALID_SYNC_PAYLOAD', 'Sync payload must be an object');
  }
  if (payloadHash(operation.payload) !== operation.payloadHash) {
    throw new LeadOperationsError('SYNC_PAYLOAD_TAMPERED', 'Sync payload hash does not match');
  }
  return operation.payload as SyncPayload;
}

function sourceTimestamp(payload: SyncPayload): Date {
  const parsed = new Date(String(payload.sourceUpdatedAt || payload.updatedAt || ''));
  if (Number.isNaN(parsed.getTime())) throw new LeadOperationsError('SOURCE_TIMESTAMP_REQUIRED', 'Source update timestamp is required');
  return parsed;
}

async function resolveInboundLead(db: PrismaClient, operation: ClaimedSync, payload: SyncPayload) {
  if (typeof payload.leadId === 'string') {
    const lead = await db.lead.findUnique({ where: { id: payload.leadId }, include: { governance: true } });
    if (lead && lead.clientId === operation.connector.clientId && lead.governance) return lead;
  }
  const reference = String(payload.leadExternalId || operation.externalId);
  const mapped = await db.leadSyncRecord.findFirst({
    where: { externalId: reference, connector: { clientId: operation.connector.clientId } },
    include: { lead: { include: { governance: true } } },
  });
  if (mapped?.lead.governance) return mapped.lead;
  if (payload.email) {
    const lead = await db.lead.findFirst({
      where: { clientId: operation.connector.clientId, email: String(payload.email).trim().toLowerCase() },
      include: { governance: true },
    });
    if (lead?.governance) return lead;
  }
  throw new LeadOperationsError('SYNC_LEAD_NOT_FOUND', 'Inbound record could not be matched to a client lead', 404);
}

async function upsertSyncRecord(
  db: PrismaClient,
  operation: ClaimedSync,
  leadId: string,
  payload: SyncPayload,
  inboundAt: Date,
) {
  const sourceUpdatedAt = sourceTimestamp(payload);
  const externalVersion = String(payload.externalVersion || payload.version || sourceUpdatedAt.toISOString());
  const existing = await db.leadSyncRecord.findUnique({
    where: { connectorId_externalId: { connectorId: operation.connectorId, externalId: operation.externalId } },
  });
  if (existing && sourceUpdatedAt < existing.sourceUpdatedAt) {
    throw new LeadOperationsError('STALE_SOURCE_VERSION', 'Inbound source record is older than the applied version');
  }
  if (existing && existing.leadId !== leadId) {
    throw new LeadOperationsError('EXTERNAL_ID_CONFLICT', 'External ID is already mapped to another lead', 409);
  }
  await db.leadSyncRecord.upsert({
    where: { connectorId_externalId: { connectorId: operation.connectorId, externalId: operation.externalId } },
    update: { leadId, externalVersion, sourceUpdatedAt, payloadHash: operation.payloadHash, lastInboundAt: inboundAt },
    create: {
      connectorId: operation.connectorId,
      leadId,
      externalId: operation.externalId,
      externalVersion,
      sourceUpdatedAt,
      payloadHash: operation.payloadHash,
      lastInboundAt: inboundAt,
    },
  });
}

async function applyInboundSync(db: PrismaClient, operation: ClaimedSync, now: Date) {
  const payload = objectPayload(operation);
  const kind = operation.connector.kind;
  if (kind === 'SUPPRESSION') {
    await addSuppression(db, {
      clientId: operation.connector.clientId,
      actorId: operation.connector.serviceUserId,
      channel: String(payload.channel || 'EMAIL'),
      destination: String(payload.destination || ''),
      region: payload.region ? String(payload.region) : null,
      reason: String(payload.reason || 'EXTERNAL_SUPPRESSION'),
      sourceSystem: operation.connector.provider,
      sourceReference: operation.externalId,
      expiresAt: payload.expiresAt ? new Date(String(payload.expiresAt)) : null,
    });
    return;
  }

  if (kind === 'CRM') {
    const existingMap = await db.leadSyncRecord.findUnique({
      where: { connectorId_externalId: { connectorId: operation.connectorId, externalId: operation.externalId } },
      include: { lead: { include: { governance: true } } },
    });
    let lead = existingMap?.lead;
    if (!lead) {
      const captured = await captureLead(db, {
        clientId: operation.connector.clientId,
        actorId: operation.connector.serviceUserId,
        ownerId: typeof payload.ownerId === 'string' ? payload.ownerId : operation.connector.serviceUserId,
        fullName: String(payload.fullName || ''),
        company: payload.company ? String(payload.company) : null,
        title: payload.title ? String(payload.title) : null,
        email: payload.email ? String(payload.email) : null,
        phone: payload.phone ? String(payload.phone) : null,
        region: String(payload.region || 'US'),
        lawfulBasis: payload.lawfulBasis ? String(payload.lawfulBasis) : null,
        source: `${operation.connector.kind}:${operation.connector.provider}`,
        customFields: { externalId: operation.externalId },
      });
      lead = { ...captured.lead, governance: captured.governance };
    } else {
      const sourceUpdatedAt = sourceTimestamp(payload);
      if (existingMap && sourceUpdatedAt >= existingMap.sourceUpdatedAt && existingMap.payloadHash !== operation.payloadHash) {
        await updateLeadProfile(db, {
          clientId: operation.connector.clientId,
          leadId: lead.id,
          actorId: operation.connector.serviceUserId,
          expectedVersion: lead.governance!.version,
          ...(payload.fullName ? { fullName: String(payload.fullName) } : {}),
          ...(payload.company !== undefined ? { company: payload.company ? String(payload.company) : null } : {}),
          ...(payload.title !== undefined ? { title: payload.title ? String(payload.title) : null } : {}),
          ...(payload.email !== undefined ? { email: payload.email ? String(payload.email) : null } : {}),
          ...(payload.phone !== undefined ? { phone: payload.phone ? String(payload.phone) : null } : {}),
        });
        await db.$transaction(async (tx) => {
          await appendLeadAudit(tx, {
            clientId: operation.connector.clientId,
            entityType: 'LEAD',
            entityId: lead!.id,
            actorId: operation.connector.serviceUserId,
            action: 'CRM_SYNC_APPLIED',
            payload: { connectorId: operation.connectorId, externalId: operation.externalId, payloadHash: operation.payloadHash },
          });
        });
      }
    }
    await upsertSyncRecord(db, operation, lead.id, payload, now);
    return;
  }

  const lead = await resolveInboundLead(db, operation, payload);
  if (kind === 'ENRICHMENT') {
    await db.$transaction(async (tx) => {
      await tx.enrichmentData.create({
        data: {
          leadId: lead.id,
          companySize: payload.companySize ? String(payload.companySize) : null,
          industry: payload.industry ? String(payload.industry) : null,
          techStack: payload.techStack ? String(payload.techStack) : null,
          location: payload.location ? String(payload.location) : null,
          extra: { source: operation.connector.provider, externalId: operation.externalId, payloadHash: operation.payloadHash },
        },
      });
      if (lead.governance && ['CAPTURED', 'DEDUPED'].includes(lead.governance.stage)) {
        await tx.leadGovernance.update({
          where: { id: lead.governance.id },
          data: { stage: 'ENRICHED', version: { increment: 1 }, lastTransitionAt: now },
        });
      }
      await appendLeadAudit(tx, {
        clientId: operation.connector.clientId,
        entityType: 'LEAD',
        entityId: lead.id,
        actorId: operation.connector.serviceUserId,
        action: 'ENRICHMENT_SYNC_APPLIED',
        payload: { connectorId: operation.connectorId, externalId: operation.externalId, payloadHash: operation.payloadHash },
      });
    });
  } else if (kind === 'CONSENT') {
    const rawState = String(payload.state || 'PENDING').toUpperCase();
    const allowedStates: ConsentValue[] = ['PENDING', 'GRANTED', 'DENIED', 'REVOKED', 'EXPIRED'];
    if (!allowedStates.includes(rawState as ConsentValue)) {
      throw new LeadOperationsError('INVALID_CONSENT_STATE', 'Inbound consent state is invalid');
    }
    const evidence = payload.evidence && typeof payload.evidence === 'object' && !Array.isArray(payload.evidence)
      ? payload.evidence as Record<string, unknown>
      : { externalVersion: payload.externalVersion };
    await recordConsent(db, {
      clientId: operation.connector.clientId,
      leadId: lead.id,
      actorId: operation.connector.serviceUserId,
      channel: String(payload.channel || 'EMAIL'),
      purpose: String(payload.purpose || 'MARKETING'),
      region: String(payload.region || lead.governance?.region || 'US'),
      state: rawState as ConsentValue,
      sourceSystem: operation.connector.provider,
      sourceReference: operation.externalId,
      evidence,
      effectiveAt: sourceTimestamp(payload),
      expiresAt: payload.expiresAt ? new Date(String(payload.expiresAt)) : null,
    });
  } else if (kind === 'EMAIL' || kind === 'CALENDAR') {
    await db.$transaction(async (tx) => {
      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          userId: operation.connector.serviceUserId,
          type: kind === 'EMAIL' ? 'EMAIL' : 'MEETING',
          timestamp: sourceTimestamp(payload),
          content: String(payload.summary || payload.subject || `${kind} activity`),
        },
      });
      await appendLeadAudit(tx, {
        clientId: operation.connector.clientId,
        entityType: 'LEAD',
        entityId: lead.id,
        actorId: operation.connector.serviceUserId,
        action: `${kind}_SYNC_APPLIED`,
        payload: { connectorId: operation.connectorId, externalId: operation.externalId, payloadHash: operation.payloadHash },
      });
    });
  }
  await upsertSyncRecord(db, operation, lead.id, payload, now);
}

async function completeSync(
  db: PrismaClient,
  operation: ClaimedSync,
  workerId: string,
  receipt: string | null,
  now: Date,
) {
  await db.$transaction(async (tx) => {
    const updated = await tx.leadSyncOperation.updateMany({
      where: { id: operation.id, status: 'LEASED', leaseOwner: workerId },
      data: {
        status: 'COMPLETED',
        attempts: { increment: 1 },
        providerReceipt: receipt,
        lastErrorCode: null,
        leaseOwner: null,
        leaseUntil: null,
      },
    });
    if (updated.count !== 1) throw new LeadOperationsError('STALE_WORKER_LEASE', 'Sync lease is no longer current', 409);
    const syncPayload = operation.payload && typeof operation.payload === 'object' && !Array.isArray(operation.payload)
      ? operation.payload as Record<string, unknown>
      : {};
    await tx.leadConnector.update({
      where: { id: operation.connectorId },
      data: { lastSucceededAt: now, consecutiveFailures: 0, cursor: typeof syncPayload.cursor === 'string' ? syncPayload.cursor : undefined },
    });
    if (operation.direction === 'OUTBOUND' && operation.entityType === 'HANDOFF') {
      const handoff = await tx.leadHandoff.findUnique({ where: { id: operation.externalId } });
      if (handoff && ['APPROVED', 'RETRY'].includes(handoff.status)) {
        await tx.leadHandoff.update({ where: { id: handoff.id }, data: { status: 'COMPLETED', completedAt: now } });
        await tx.leadGovernance.update({
          where: { leadId: handoff.leadId },
          data: { stage: 'HANDED_OFF', ownerId: handoff.toOwnerId, handedOffAt: now, handedOffTo: handoff.toOwnerId, version: { increment: 1 }, lastTransitionAt: now },
        });
      }
    }
    await appendLeadAudit(tx, {
      clientId: operation.connector.clientId,
      entityType: 'SYNC_OPERATION',
      entityId: operation.id,
      actorId: workerId,
      action: 'SYNC_COMPLETED',
      payload: { receipt, direction: operation.direction, connectorId: operation.connectorId },
    });
  });
}

export async function processOneSyncOperation(
  db: PrismaClient,
  workerId: string,
  now = new Date(),
): Promise<'idle' | 'completed' | 'retry' | 'dead-letter'> {
  if (!/^[A-Za-z0-9_.:-]{3,100}$/.test(workerId)) throw new LeadOperationsError('INVALID_WORKER_ID', 'Worker ID is invalid');
  const operationId = await claimSyncOperation(db, workerId, now);
  if (!operationId) return 'idle';
  const operation = await db.leadSyncOperation.findUnique({
    where: { id: operationId },
    include: { connector: true },
  }) as ClaimedSync | null;
  if (!operation || operation.leaseOwner !== workerId || operation.status !== 'LEASED') return 'idle';
  try {
    let receipt: string | null = null;
    if (operation.direction === 'INBOUND') {
      await applyInboundSync(db, operation, now);
      receipt = `inbound-${operation.payloadHash.slice(0, 16)}`;
    } else {
      const response = await postConnector({
        url: operation.connector.baseUrl,
        credentialRef: operation.connector.credentialRef,
        idempotencyKey: operation.idempotencyKey,
        body: operation.payload,
      });
      receipt = response.receipt;
    }
    await completeSync(db, operation, workerId, receipt, now);
    return 'completed';
  } catch (error) {
    const failure = asLeadOperationsError(error);
    const attempts = operation.attempts + 1;
    const retryable = failure.retryable && attempts < operation.maxAttempts;
    await db.$transaction(async (tx) => {
      const updated = await tx.leadSyncOperation.updateMany({
        where: { id: operation.id, status: 'LEASED', leaseOwner: workerId },
        data: {
          status: retryable ? 'RETRY' : 'DEAD_LETTER',
          attempts,
          nextAttemptAt: retryable ? retryAt(attempts, now) : now,
          lastErrorCode: failure.code,
          leaseOwner: null,
          leaseUntil: null,
        },
      });
      if (updated.count === 1) {
        await tx.leadConnector.update({ where: { id: operation.connectorId }, data: { consecutiveFailures: { increment: 1 } } });
        if (operation.entityType === 'HANDOFF') {
          const handoff = await tx.leadHandoff.findUnique({ where: { id: operation.externalId } });
          await tx.leadHandoff.updateMany({
            where: { id: operation.externalId, status: { in: ['APPROVED', 'RETRY'] } },
            data: {
              status: retryable ? 'RETRY' : 'DEAD_LETTER',
              attempts,
              nextAttemptAt: retryable ? retryAt(attempts, now) : null,
              lastErrorCode: failure.code,
            },
          });
          if (handoff) {
            await tx.leadGovernance.updateMany({
              where: { leadId: handoff.leadId, stage: 'HANDOFF_PENDING' },
              data: { stage: 'RETRY_PENDING', version: { increment: 1 }, lastTransitionAt: now },
            });
          }
        }
        await appendLeadAudit(tx, {
          clientId: operation.connector.clientId,
          entityType: 'SYNC_OPERATION',
          entityId: operation.id,
          actorId: workerId,
          action: retryable ? 'SYNC_RETRY_SCHEDULED' : 'SYNC_DEAD_LETTERED',
          payload: { errorCode: failure.code, attempts },
        });
      }
    });
    return retryable ? 'retry' : 'dead-letter';
  }
}
