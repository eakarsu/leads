import {
  AccountLifecycleStage,
  ConnectorKind,
  GovernedLeadStage,
  LeadHandoffStatus,
  OutreachState,
  Prisma,
  PrismaClient,
  UserRole,
} from '@prisma/client';
import { appendLeadAudit } from './audit';
import { LeadOperationsError } from './errors';
import {
  destinationHash,
  leadDedupeKey,
  normalizeEmail,
  normalizePhone,
  normalizeText,
  payloadHash,
  safeIdempotencyKey,
} from './identity';

type JsonObject = Record<string, unknown>;

export type CaptureLeadInput = {
  clientId: string;
  actorId: string;
  ownerId?: string;
  fullName: string;
  company?: string | null;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  campaignId?: string | null;
  source?: string | null;
  region?: string;
  lawfulBasis?: string | null;
  customFields?: JsonObject;
};

const transitions: Record<GovernedLeadStage, GovernedLeadStage[]> = {
  CAPTURED: ['DEDUPED', 'REVIEW_PENDING', 'SUPPRESSED'],
  DEDUPED: ['ENRICHED', 'REVIEW_PENDING', 'SUPPRESSED'],
  ENRICHED: ['REVIEW_PENDING', 'SUPPRESSED'],
  REVIEW_PENDING: ['OUTREACH_APPROVED', 'DISQUALIFIED', 'SUPPRESSED'],
  OUTREACH_APPROVED: ['CONTACTED', 'RETRY_PENDING', 'SUPPRESSED'],
  CONTACTED: ['ENGAGED', 'QUALIFIED', 'RETRY_PENDING', 'DISQUALIFIED', 'SUPPRESSED'],
  ENGAGED: ['QUALIFIED', 'RETRY_PENDING', 'DISQUALIFIED', 'SUPPRESSED'],
  QUALIFIED: ['HANDOFF_PENDING', 'HANDED_OFF', 'DISQUALIFIED'],
  HANDOFF_PENDING: ['HANDED_OFF', 'RETRY_PENDING', 'DISQUALIFIED'],
  HANDED_OFF: ['CONVERTED', 'RETRY_PENDING'],
  RETRY_PENDING: ['ENRICHED', 'REVIEW_PENDING', 'OUTREACH_APPROVED', 'HANDOFF_PENDING', 'HANDED_OFF', 'SUPPRESSED'],
  CONVERTED: [],
  DISQUALIFIED: ['REVIEW_PENDING'],
  SUPPRESSED: [],
};

async function assertClientAndOwner(
  tx: Prisma.TransactionClient,
  clientId: string,
  ownerId: string,
) {
  const [client, owner] = await Promise.all([
    tx.clientCompany.findUnique({ where: { id: clientId } }),
    tx.user.findUnique({ where: { id: ownerId } }),
  ]);
  if (!client || client.lifecycleStage === 'ARCHIVED') {
    throw new LeadOperationsError('CLIENT_NOT_ACTIVE', 'The client account is not available', 404);
  }
  if (!owner || owner.status !== 'ACTIVE') {
    throw new LeadOperationsError('OWNER_NOT_ACTIVE', 'The selected owner is not active');
  }
  if (owner.role === 'CLIENT' && owner.clientId !== clientId) {
    throw new LeadOperationsError('OWNER_TENANT_MISMATCH', 'The selected owner belongs to another client', 403);
  }
  return { client, owner };
}

async function getGovernedLead(
  tx: Prisma.TransactionClient,
  clientId: string,
  leadId: string,
) {
  const record = await tx.leadGovernance.findUnique({
    where: { leadId },
    include: { lead: true },
  });
  if (!record || record.clientId !== clientId || record.lead.clientId !== clientId) {
    throw new LeadOperationsError('LEAD_NOT_FOUND', 'Lead not found', 404);
  }
  return record;
}

export async function captureLead(db: PrismaClient, input: CaptureLeadInput) {
  const fullName = input.fullName.trim().replace(/\s+/g, ' ');
  if (fullName.length < 2 || fullName.length > 160) {
    throw new LeadOperationsError('INVALID_NAME', 'Full name must contain 2-160 characters');
  }
  const email = input.email ? normalizeEmail(input.email) : null;
  const phone = input.phone ? normalizePhone(input.phone) : null;
  const dedupeKey = leadDedupeKey({ ...input, fullName, email, phone });

  const existing = await db.leadGovernance.findUnique({
    where: { clientId_dedupeKey: { clientId: input.clientId, dedupeKey } },
    include: { lead: true },
  });
  if (existing) return { lead: existing.lead, governance: existing, duplicate: true };

  try {
    return await db.$transaction(async (tx) => {
      const ownerId = input.ownerId || input.actorId;
      const { client } = await assertClientAndOwner(tx, input.clientId, ownerId);
      if (client.lifecycleStage === 'SUSPENDED') {
        throw new LeadOperationsError('CLIENT_SUSPENDED', 'Lead capture is disabled for this account', 403);
      }
      if (input.campaignId) {
        const campaign = await tx.campaign.findUnique({ where: { id: input.campaignId } });
        if (!campaign || campaign.clientId !== input.clientId) {
          throw new LeadOperationsError('CAMPAIGN_NOT_FOUND', 'Campaign not found for this client', 404);
        }
      }

      const lead = await tx.lead.create({
        data: {
          clientId: input.clientId,
          campaignId: input.campaignId || null,
          fullName,
          company: input.company?.trim() || null,
          title: input.title?.trim() || null,
          email,
          phone,
          source: input.source?.trim() || 'MANUAL',
          leadSource: 'MANUAL',
          submittedBy: input.actorId,
          customFields: (input.customFields || {}) as Prisma.InputJsonValue,
        },
      });
      const governance = await tx.leadGovernance.create({
        data: {
          leadId: lead.id,
          clientId: input.clientId,
          ownerId,
          dedupeKey,
          region: (input.region || client.defaultRegion).toUpperCase(),
          lawfulBasis: input.lawfulBasis || null,
          stage: 'CAPTURED',
        },
      });
      await appendLeadAudit(tx, {
        clientId: input.clientId,
        entityType: 'LEAD',
        entityId: lead.id,
        actorId: input.actorId,
        action: 'LEAD_CAPTURED',
        payload: { dedupeKey, ownerId, source: lead.source || 'MANUAL' },
      });
      return { lead, governance, duplicate: false };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const duplicate = await db.leadGovernance.findUnique({
        where: { clientId_dedupeKey: { clientId: input.clientId, dedupeKey } },
        include: { lead: true },
      });
      if (duplicate) return { lead: duplicate.lead, governance: duplicate, duplicate: true };
    }
    throw error;
  }
}

export async function updateLeadProfile(
  db: PrismaClient,
  input: {
    clientId: string;
    leadId: string;
    actorId: string;
    expectedVersion: number;
    fullName?: string;
    company?: string | null;
    title?: string | null;
    email?: string | null;
    phone?: string | null;
  },
) {
  return db.$transaction(async (tx) => {
    const current = await getGovernedLead(tx, input.clientId, input.leadId);
    if (current.version !== input.expectedVersion) {
      throw new LeadOperationsError('VERSION_CONFLICT', 'The lead changed; reload before saving', 409);
    }
    const email = input.email === undefined ? undefined : input.email ? normalizeEmail(input.email) : null;
    const phone = input.phone === undefined ? undefined : input.phone ? normalizePhone(input.phone) : null;
    const fullName = input.fullName?.trim().replace(/\s+/g, ' ');
    const identityChanged = email !== undefined || phone !== undefined || fullName !== undefined || input.company !== undefined;
    const nextIdentity = {
      email: email === undefined ? current.lead.email : email,
      phone: phone === undefined ? current.lead.phone : phone,
      fullName: fullName || current.lead.fullName,
      company: input.company === undefined ? current.lead.company : input.company,
    };
    const dedupeKey = identityChanged ? leadDedupeKey(nextIdentity) : current.dedupeKey;
    const collision = await tx.leadGovernance.findUnique({
      where: { clientId_dedupeKey: { clientId: input.clientId, dedupeKey } },
    });
    if (collision && collision.leadId !== input.leadId) {
      throw new LeadOperationsError('DUPLICATE_LEAD', 'These identity fields belong to another lead', 409);
    }
    const lead = await tx.lead.update({
      where: { id: input.leadId },
      data: {
        ...(fullName && { fullName }),
        ...(input.company !== undefined && { company: input.company?.trim() || null }),
        ...(input.title !== undefined && { title: input.title?.trim() || null }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
      },
    });
    const updated = await tx.leadGovernance.updateMany({
      where: { id: current.id, version: input.expectedVersion },
      data: { dedupeKey, version: { increment: 1 } },
    });
    if (updated.count !== 1) throw new LeadOperationsError('VERSION_CONFLICT', 'The lead changed; reload before saving', 409);
    await appendLeadAudit(tx, {
      clientId: input.clientId,
      entityType: 'LEAD',
      entityId: input.leadId,
      actorId: input.actorId,
      action: 'LEAD_PROFILE_UPDATED',
      payload: { version: input.expectedVersion + 1, identityChanged },
    });
    return lead;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

async function queueLeadSnapshot(
  tx: Prisma.TransactionClient,
  clientId: string,
  leadId: string,
  version: number,
  payload: Prisma.InputJsonValue,
) {
  const connectors = await tx.leadConnector.findMany({
    where: { clientId, kind: 'CRM', enabled: true, syncDirection: { in: ['OUTBOUND', 'BOTH'] } },
  });
  for (const connector of connectors) {
    const key = `lead:${leadId}:v${version}:${connector.id}`;
    await tx.leadSyncOperation.upsert({
      where: { idempotencyKey: key },
      update: {},
      create: {
        connectorId: connector.id,
        direction: 'OUTBOUND',
        entityType: 'LEAD',
        externalId: leadId,
        idempotencyKey: key,
        payload,
        payloadHash: payloadHash(payload),
      },
    });
  }
}

export async function transitionLead(
  db: PrismaClient,
  input: {
    clientId: string;
    leadId: string;
    actorId: string;
    expectedVersion: number;
    to: GovernedLeadStage;
    reason: string;
  },
) {
  return db.$transaction(async (tx) => {
    const current = await getGovernedLead(tx, input.clientId, input.leadId);
    if (current.version !== input.expectedVersion) {
      throw new LeadOperationsError('VERSION_CONFLICT', 'The lead changed; reload before transitioning', 409);
    }
    if (!transitions[current.stage].includes(input.to)) {
      throw new LeadOperationsError(
        'INVALID_TRANSITION',
        `Lead stage cannot move from ${current.stage} to ${input.to}`,
        409,
      );
    }
    if (input.reason.trim().length < 3) {
      throw new LeadOperationsError('REASON_REQUIRED', 'A transition reason is required');
    }
    const result = await tx.leadGovernance.updateMany({
      where: { id: current.id, version: input.expectedVersion },
      data: { stage: input.to, version: { increment: 1 }, lastTransitionAt: new Date() },
    });
    if (result.count !== 1) throw new LeadOperationsError('VERSION_CONFLICT', 'The lead changed; reload before transitioning', 409);
    const snapshot = {
      leadId: current.leadId,
      fullName: current.lead.fullName,
      email: current.lead.email,
      phone: current.lead.phone,
      company: current.lead.company,
      stage: input.to,
      ownerId: current.ownerId,
      version: input.expectedVersion + 1,
    };
    await queueLeadSnapshot(tx, input.clientId, input.leadId, input.expectedVersion + 1, snapshot);
    await appendLeadAudit(tx, {
      clientId: input.clientId,
      entityType: 'LEAD',
      entityId: input.leadId,
      actorId: input.actorId,
      action: 'LEAD_STAGE_TRANSITIONED',
      payload: { from: current.stage, to: input.to, reason: input.reason.trim(), version: input.expectedVersion + 1 },
    });
    return { ...current, stage: input.to, version: input.expectedVersion + 1 };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function recordConsent(
  db: PrismaClient,
  input: {
    clientId: string;
    leadId: string;
    actorId: string;
    channel: string;
    purpose: string;
    region: string;
    state: 'PENDING' | 'GRANTED' | 'DENIED' | 'REVOKED' | 'EXPIRED';
    sourceSystem: string;
    sourceReference: string;
    evidence: JsonObject;
    effectiveAt?: Date;
    expiresAt?: Date | null;
  },
) {
  return db.$transaction(async (tx) => {
    const current = await getGovernedLead(tx, input.clientId, input.leadId);
    const effectiveAt = input.effectiveAt || new Date();
    const record = await tx.leadConsent.create({
      data: {
        leadId: input.leadId,
        channel: input.channel.toUpperCase(),
        purpose: input.purpose.toUpperCase(),
        region: input.region.toUpperCase(),
        state: input.state,
        sourceSystem: input.sourceSystem,
        sourceReference: input.sourceReference,
        evidenceHash: payloadHash(input.evidence),
        effectiveAt,
        expiresAt: input.expiresAt || null,
        revokedAt: ['DENIED', 'REVOKED'].includes(input.state) ? effectiveAt : null,
      },
    });
    if (['DENIED', 'REVOKED'].includes(input.state)) {
      const destination = input.channel.toUpperCase() === 'EMAIL' ? current.lead.email : current.lead.phone;
      if (destination) {
        await tx.leadSuppression.upsert({
          where: {
            clientId_channel_normalizedHash: {
              clientId: input.clientId,
              channel: input.channel.toUpperCase(),
              normalizedHash: destinationHash(input.channel, destination),
            },
          },
          update: {
            reason: input.state === 'REVOKED' ? 'OPT_OUT' : 'CONSENT_DENIED',
            sourceSystem: input.sourceSystem,
            sourceReference: input.sourceReference,
            effectiveAt,
            expiresAt: null,
          },
          create: {
            clientId: input.clientId,
            channel: input.channel.toUpperCase(),
            normalizedHash: destinationHash(input.channel, destination),
            region: input.region.toUpperCase(),
            reason: input.state === 'REVOKED' ? 'OPT_OUT' : 'CONSENT_DENIED',
            sourceSystem: input.sourceSystem,
            sourceReference: input.sourceReference,
            effectiveAt,
          },
        });
      }
      await tx.leadGovernance.updateMany({
        where: { id: current.id, stage: { notIn: ['CONVERTED', 'DISQUALIFIED'] } },
        data: { stage: 'SUPPRESSED', version: { increment: 1 }, lastTransitionAt: effectiveAt },
      });
      await tx.governedOutreach.updateMany({
        where: { leadId: input.leadId, state: { in: ['DRAFT', 'REVIEW_PENDING', 'APPROVED', 'RETRY'] } },
        data: { state: 'BLOCKED', lastErrorCode: 'CONSENT_REVOKED', leaseOwner: null, leaseUntil: null },
      });
    }
    await appendLeadAudit(tx, {
      clientId: input.clientId,
      entityType: 'LEAD',
      entityId: input.leadId,
      actorId: input.actorId,
      action: 'CONSENT_RECORDED',
      payload: {
        consentId: record.id,
        channel: record.channel,
        purpose: record.purpose,
        state: record.state,
        sourceSystem: record.sourceSystem,
        sourceReference: record.sourceReference,
        evidenceHash: record.evidenceHash,
      },
    });
    return record;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function addSuppression(
  db: PrismaClient,
  input: {
    clientId: string;
    actorId: string;
    channel: string;
    destination: string;
    region?: string | null;
    reason: string;
    sourceSystem: string;
    sourceReference: string;
    expiresAt?: Date | null;
  },
) {
  const channel = input.channel.toUpperCase();
  const normalizedHash = destinationHash(channel, input.destination);
  return db.$transaction(async (tx) => {
    const record = await tx.leadSuppression.upsert({
      where: { clientId_channel_normalizedHash: { clientId: input.clientId, channel, normalizedHash } },
      update: {
        reason: input.reason,
        sourceSystem: input.sourceSystem,
        sourceReference: input.sourceReference,
        region: input.region?.toUpperCase() || null,
        effectiveAt: new Date(),
        expiresAt: input.expiresAt || null,
      },
      create: {
        clientId: input.clientId,
        channel,
        normalizedHash,
        region: input.region?.toUpperCase() || null,
        reason: input.reason,
        sourceSystem: input.sourceSystem,
        sourceReference: input.sourceReference,
        effectiveAt: new Date(),
        expiresAt: input.expiresAt || null,
      },
    });
    await appendLeadAudit(tx, {
      clientId: input.clientId,
      entityType: 'SUPPRESSION',
      entityId: record.id,
      actorId: input.actorId,
      action: 'DESTINATION_SUPPRESSED',
      payload: { channel, normalizedHash, reason: input.reason, sourceSystem: input.sourceSystem },
    });
    return record;
  });
}

export type OutreachControlResult = { allowed: boolean; reasons: string[] };

export async function evaluateOutreachControls(
  tx: Prisma.TransactionClient,
  outreachId: string,
  now = new Date(),
): Promise<OutreachControlResult> {
  const outreach = await tx.governedOutreach.findUnique({
    where: { id: outreachId },
    include: { lead: { include: { client: true, governance: true } } },
  });
  if (!outreach) throw new LeadOperationsError('OUTREACH_NOT_FOUND', 'Outreach not found', 404);
  const channel = outreach.channel.toUpperCase();
  const destination = channel === 'EMAIL' ? outreach.lead.email : outreach.lead.phone;
  const reasons: string[] = [];
  if (!destination) reasons.push('DESTINATION_MISSING');
  const policy = await tx.outreachPolicy.findUnique({
    where: {
      clientId_region_channel: {
        clientId: outreach.lead.clientId,
        region: outreach.region,
        channel,
      },
    },
  });
  if (policy && !policy.enabled) reasons.push('POLICY_DISABLED');
  if (policy?.requireHumanReview !== false && !outreach.approvedBy) reasons.push('HUMAN_REVIEW_REQUIRED');
  if (outreach.approvedBy && outreach.approvedBy === outreach.createdBy) reasons.push('SEPARATE_REVIEWER_REQUIRED');

  const requireConsent = policy?.requireConsent !== false;
  if (requireConsent) {
    const consent = await tx.leadConsent.findFirst({
      where: {
        leadId: outreach.leadId,
        channel,
        purpose: outreach.purpose,
        effectiveAt: { lte: now },
      },
      orderBy: [{ effectiveAt: 'desc' }, { createdAt: 'desc' }],
    });
    if (!consent || consent.state !== 'GRANTED' || (consent.expiresAt && consent.expiresAt <= now)) {
      reasons.push('CONSENT_NOT_GRANTED');
    }
  }
  if (destination) {
    const suppression = await tx.leadSuppression.findUnique({
      where: {
        clientId_channel_normalizedHash: {
          clientId: outreach.lead.clientId,
          channel,
          normalizedHash: destinationHash(channel, destination),
        },
      },
    });
    if (suppression && suppression.effectiveAt <= now && (!suppression.expiresAt || suppression.expiresAt > now)) {
      reasons.push('DESTINATION_SUPPRESSED');
    }
  }
  const hourStart = new Date(now.getTime() - 60 * 60 * 1000);
  const dayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [hourCount, dayCount] = await Promise.all([
    tx.governedOutreach.count({
      where: { state: 'SENT', sentAt: { gte: hourStart }, lead: { clientId: outreach.lead.clientId }, channel },
    }),
    tx.governedOutreach.count({
      where: { state: 'SENT', sentAt: { gte: dayStart }, lead: { clientId: outreach.lead.clientId }, channel },
    }),
  ]);
  const maxPerHour = policy?.maxPerHour || outreach.lead.client.maxOutreachPerHour;
  const maxPerDay = policy?.maxPerDay || outreach.lead.client.maxOutreachPerDay;
  if (hourCount >= maxPerHour) reasons.push('HOURLY_RATE_LIMIT');
  if (dayCount >= maxPerDay) reasons.push('DAILY_RATE_LIMIT');

  if (policy) {
    try {
      const localHour = Number(new Intl.DateTimeFormat('en-US', {
        timeZone: policy.timezone,
        hour: '2-digit',
        hourCycle: 'h23',
      }).format(now));
      const inQuietHours = policy.quietHoursStart > policy.quietHoursEnd
        ? localHour >= policy.quietHoursStart || localHour < policy.quietHoursEnd
        : localHour >= policy.quietHoursStart && localHour < policy.quietHoursEnd;
      if (inQuietHours) reasons.push('QUIET_HOURS');
    } catch {
      reasons.push('INVALID_POLICY_TIMEZONE');
    }
  }
  if (outreach.lead.governance?.stage === 'SUPPRESSED') reasons.push('LEAD_SUPPRESSED');
  return { allowed: reasons.length === 0, reasons: [...new Set(reasons)] };
}

export async function createOutreach(
  db: PrismaClient,
  input: {
    clientId: string;
    leadId: string;
    actorId: string;
    channel: string;
    purpose: string;
    region: string;
    subject?: string | null;
    body: string;
    idempotencyKey: string;
    scheduledAt?: Date | null;
  },
) {
  const idempotencyKey = safeIdempotencyKey(input.idempotencyKey);
  const channel = input.channel.toUpperCase();
  const purpose = input.purpose.toUpperCase();
  const region = input.region.toUpperCase();
  const subject = input.subject?.trim() || null;
  const contentHash = payloadHash({ subject, body: input.body });
  if (input.body.trim().length < 1 || input.body.length > 100_000) {
    throw new LeadOperationsError('INVALID_CONTENT', 'Outreach body must contain 1-100000 characters');
  }
  return db.$transaction(async (tx) => {
    const current = await getGovernedLead(tx, input.clientId, input.leadId);
    const existing = await tx.governedOutreach.findUnique({ where: { idempotencyKey } });
    if (existing) {
      const sameSchedule = existing.scheduledAt?.getTime() === input.scheduledAt?.getTime()
        || (!existing.scheduledAt && !input.scheduledAt);
      if (
        existing.leadId !== input.leadId
        || existing.channel !== channel
        || existing.purpose !== purpose
        || existing.region !== region
        || existing.contentHash !== contentHash
        || !sameSchedule
      ) {
        throw new LeadOperationsError('IDEMPOTENCY_CONFLICT', 'The idempotency key was used for different outreach', 409);
      }
      return existing;
    }
    if (['CONVERTED', 'DISQUALIFIED', 'SUPPRESSED'].includes(current.stage)) {
      throw new LeadOperationsError('LEAD_NOT_CONTACTABLE', `Leads in ${current.stage} cannot receive outreach`, 409);
    }
    const policy = await tx.outreachPolicy.findUnique({
      where: {
        clientId_region_channel: {
          clientId: input.clientId,
          region,
          channel,
        },
      },
    });
    const state: OutreachState = policy?.requireHumanReview === false ? 'APPROVED' : 'REVIEW_PENDING';
    const outreach = await tx.governedOutreach.create({
      data: {
        leadId: input.leadId,
        channel,
        purpose,
        region,
        subject,
        body: input.body,
        contentHash,
        state,
        createdBy: input.actorId,
        approvedBy: null,
        approvedAt: state === 'APPROVED' ? new Date() : null,
        idempotencyKey,
        scheduledAt: input.scheduledAt || null,
        nextAttemptAt: state === 'APPROVED' ? input.scheduledAt || new Date() : null,
      },
    });
    await appendLeadAudit(tx, {
      clientId: input.clientId,
      entityType: 'OUTREACH',
      entityId: outreach.id,
      actorId: input.actorId,
      action: 'OUTREACH_CREATED',
      payload: { leadId: input.leadId, channel: outreach.channel, purpose: outreach.purpose, state, contentHash: outreach.contentHash },
    });
    return outreach;
  });
}

export async function reviewOutreach(
  db: PrismaClient,
  input: { clientId: string; outreachId: string; reviewerId: string; approve: boolean; reason: string },
) {
  return db.$transaction(async (tx) => {
    const outreach = await tx.governedOutreach.findUnique({
      where: { id: input.outreachId },
      include: { lead: { include: { governance: true } } },
    });
    if (!outreach || outreach.lead.clientId !== input.clientId) {
      throw new LeadOperationsError('OUTREACH_NOT_FOUND', 'Outreach not found', 404);
    }
    if (outreach.state !== 'REVIEW_PENDING') {
      throw new LeadOperationsError('OUTREACH_NOT_REVIEWABLE', 'Only pending outreach can be reviewed', 409);
    }
    if (outreach.createdBy === input.reviewerId) {
      throw new LeadOperationsError('SEPARATE_REVIEWER_REQUIRED', 'The creator cannot approve their own outreach', 403);
    }
    if (input.reason.trim().length < 3) throw new LeadOperationsError('REASON_REQUIRED', 'A review reason is required');
    const state: OutreachState = input.approve ? 'APPROVED' : 'CANCELLED';
    const updated = await tx.governedOutreach.update({
      where: { id: outreach.id },
      data: {
        state,
        approvedBy: input.approve ? input.reviewerId : null,
        approvedAt: input.approve ? new Date() : null,
        nextAttemptAt: input.approve ? outreach.scheduledAt || new Date() : null,
        lastErrorCode: input.approve ? null : 'REJECTED_BY_REVIEWER',
      },
    });
    if (input.approve && outreach.lead.governance?.stage === 'REVIEW_PENDING') {
      await tx.leadGovernance.update({
        where: { id: outreach.lead.governance.id },
        data: { stage: 'OUTREACH_APPROVED', version: { increment: 1 }, lastTransitionAt: new Date() },
      });
    }
    await appendLeadAudit(tx, {
      clientId: input.clientId,
      entityType: 'OUTREACH',
      entityId: outreach.id,
      actorId: input.reviewerId,
      action: input.approve ? 'OUTREACH_APPROVED' : 'OUTREACH_REJECTED',
      payload: { reason: input.reason.trim() },
    });
    return updated;
  });
}

export async function cancelOutreach(
  db: PrismaClient,
  input: { clientId: string; outreachId: string; actorId: string; reason: string },
) {
  return db.$transaction(async (tx) => {
    const outreach = await tx.governedOutreach.findUnique({ where: { id: input.outreachId }, include: { lead: true } });
    if (!outreach || outreach.lead.clientId !== input.clientId) throw new LeadOperationsError('OUTREACH_NOT_FOUND', 'Outreach not found', 404);
    if (!['DRAFT', 'REVIEW_PENDING', 'APPROVED', 'RETRY', 'BLOCKED'].includes(outreach.state)) {
      throw new LeadOperationsError('OUTREACH_NOT_CANCELLABLE', 'This outreach can no longer be cancelled', 409);
    }
    const result = await tx.governedOutreach.update({
      where: { id: outreach.id },
      data: { state: 'CANCELLED', nextAttemptAt: null, leaseOwner: null, leaseUntil: null, lastErrorCode: 'CANCELLED_BY_USER' },
    });
    await appendLeadAudit(tx, {
      clientId: input.clientId,
      entityType: 'OUTREACH',
      entityId: outreach.id,
      actorId: input.actorId,
      action: 'OUTREACH_CANCELLED',
      payload: { reason: input.reason },
    });
    return result;
  });
}

export async function retryOutreach(
  db: PrismaClient,
  input: { clientId: string; outreachId: string; actorId: string; reason: string },
) {
  return db.$transaction(async (tx) => {
    const outreach = await tx.governedOutreach.findUnique({ where: { id: input.outreachId }, include: { lead: true } });
    if (!outreach || outreach.lead.clientId !== input.clientId) throw new LeadOperationsError('OUTREACH_NOT_FOUND', 'Outreach not found', 404);
    if (!['BLOCKED', 'DEAD_LETTER'].includes(outreach.state)) {
      throw new LeadOperationsError('OUTREACH_NOT_RETRYABLE', 'Only blocked or dead-letter outreach can be repaired', 409);
    }
    if (!outreach.approvedBy) {
      throw new LeadOperationsError('REVIEW_REQUIRED', 'Outreach needs a human approval before retry', 409);
    }
    const updated = await tx.governedOutreach.update({
      where: { id: outreach.id },
      data: { state: 'RETRY', attempts: 0, nextAttemptAt: new Date(), lastErrorCode: null, leaseOwner: null, leaseUntil: null },
    });
    await appendLeadAudit(tx, {
      clientId: input.clientId,
      entityType: 'OUTREACH',
      entityId: outreach.id,
      actorId: input.actorId,
      action: 'OUTREACH_MANUAL_RETRY',
      payload: { reason: input.reason.trim() },
    });
    return updated;
  });
}

export async function requestHandoff(
  db: PrismaClient,
  input: {
    clientId: string;
    leadId: string;
    actorId: string;
    toOwnerId: string;
    targetConnectorId?: string | null;
  },
) {
  return db.$transaction(async (tx) => {
    const lead = await getGovernedLead(tx, input.clientId, input.leadId);
    if (!['QUALIFIED', 'RETRY_PENDING'].includes(lead.stage)) {
      throw new LeadOperationsError('HANDOFF_NOT_READY', 'Only qualified leads can enter handoff', 409);
    }
    await assertClientAndOwner(tx, input.clientId, input.toOwnerId);
    if (input.targetConnectorId) {
      const connector = await tx.leadConnector.findUnique({ where: { id: input.targetConnectorId } });
      if (!connector || connector.clientId !== input.clientId || connector.kind !== 'CRM') {
        throw new LeadOperationsError('CONNECTOR_NOT_FOUND', 'Handoff CRM connector not found', 404);
      }
    }
    const handoff = await tx.leadHandoff.create({
      data: {
        leadId: input.leadId,
        clientId: input.clientId,
        fromOwnerId: lead.ownerId,
        toOwnerId: input.toOwnerId,
        targetConnectorId: input.targetConnectorId || null,
        requestedBy: input.actorId,
      },
    });
    await tx.leadGovernance.update({
      where: { id: lead.id },
      data: { stage: 'HANDOFF_PENDING', version: { increment: 1 }, lastTransitionAt: new Date() },
    });
    await appendLeadAudit(tx, {
      clientId: input.clientId,
      entityType: 'LEAD',
      entityId: input.leadId,
      actorId: input.actorId,
      action: 'HANDOFF_REQUESTED',
      payload: { handoffId: handoff.id, fromOwnerId: handoff.fromOwnerId, toOwnerId: handoff.toOwnerId, targetConnectorId: handoff.targetConnectorId },
    });
    return handoff;
  });
}

export async function decideHandoff(
  db: PrismaClient,
  input: {
    clientId: string;
    handoffId: string;
    actorId: string;
    approve: boolean;
    reason: string;
  },
) {
  return db.$transaction(async (tx) => {
    const handoff = await tx.leadHandoff.findUnique({ where: { id: input.handoffId } });
    if (!handoff || handoff.clientId !== input.clientId) throw new LeadOperationsError('HANDOFF_NOT_FOUND', 'Handoff not found', 404);
    if (handoff.status !== 'PENDING') throw new LeadOperationsError('HANDOFF_ALREADY_DECIDED', 'Handoff has already been decided', 409);
    if (handoff.requestedBy === input.actorId) throw new LeadOperationsError('SEPARATE_REVIEWER_REQUIRED', 'The requester cannot approve their own handoff', 403);
    const status: LeadHandoffStatus = input.approve ? (handoff.targetConnectorId ? 'APPROVED' : 'COMPLETED') : 'REJECTED';
    const updated = await tx.leadHandoff.update({
      where: { id: handoff.id },
      data: {
        status,
        decidedBy: input.actorId,
        decisionReason: input.reason.trim(),
        decidedAt: new Date(),
        completedAt: status === 'COMPLETED' ? new Date() : null,
        nextAttemptAt: status === 'APPROVED' ? new Date() : null,
      },
    });
    if (input.approve && status === 'APPROVED' && handoff.targetConnectorId) {
      const syncPayload = {
        handoffId: handoff.id,
        leadId: handoff.leadId,
        fromOwnerId: handoff.fromOwnerId,
        toOwnerId: handoff.toOwnerId,
        approvedBy: input.actorId,
      };
      await tx.leadSyncOperation.create({
        data: {
          connectorId: handoff.targetConnectorId,
          direction: 'OUTBOUND',
          entityType: 'HANDOFF',
          externalId: handoff.id,
          idempotencyKey: `handoff:${handoff.id}`,
          payload: syncPayload,
          payloadHash: payloadHash(syncPayload),
        },
      });
    }
    const stage: GovernedLeadStage = input.approve && status === 'COMPLETED' ? 'HANDED_OFF' : input.approve ? 'HANDOFF_PENDING' : 'QUALIFIED';
    await tx.leadGovernance.update({
      where: { leadId: handoff.leadId },
      data: {
        stage,
        ownerId: status === 'COMPLETED' ? handoff.toOwnerId : undefined,
        handedOffAt: status === 'COMPLETED' ? new Date() : null,
        handedOffTo: status === 'COMPLETED' ? handoff.toOwnerId : null,
        version: { increment: 1 },
        lastTransitionAt: new Date(),
      },
    });
    await appendLeadAudit(tx, {
      clientId: input.clientId,
      entityType: 'LEAD',
      entityId: handoff.leadId,
      actorId: input.actorId,
      action: input.approve ? 'HANDOFF_APPROVED' : 'HANDOFF_REJECTED',
      payload: { handoffId: handoff.id, reason: input.reason.trim(), status },
    });
    return updated;
  });
}

export async function recordConversion(
  db: PrismaClient,
  input: {
    clientId: string;
    leadId: string;
    opportunityId: string;
    actorId: string;
    model: string;
    touchpoints: JsonObject[];
  },
) {
  return db.$transaction(async (tx) => {
    const lead = await getGovernedLead(tx, input.clientId, input.leadId);
    const opportunity = await tx.opportunity.findUnique({ where: { id: input.opportunityId } });
    if (!opportunity || opportunity.clientId !== input.clientId || (opportunity.leadId && opportunity.leadId !== input.leadId)) {
      throw new LeadOperationsError('OPPORTUNITY_NOT_FOUND', 'Opportunity not found for this lead', 404);
    }
    if (!['QUALIFIED', 'HANDED_OFF'].includes(lead.stage)) {
      throw new LeadOperationsError('CONVERSION_NOT_READY', 'The lead must be qualified or handed off before conversion', 409);
    }
    const sentOutreach = await tx.governedOutreach.count({ where: { leadId: input.leadId, state: 'SENT' } });
    const dataQuality = {
      hasEmail: Boolean(lead.lead.email),
      hasPhone: Boolean(lead.lead.phone),
      hasCompany: Boolean(lead.lead.company),
      hasCampaign: Boolean(lead.lead.campaignId),
      sentOutreach,
      touchpointCount: input.touchpoints.length,
      completenessPercent: Math.round(([
        lead.lead.email,
        lead.lead.phone,
        lead.lead.company,
        lead.lead.title,
        lead.lead.campaignId,
      ].filter(Boolean).length / 5) * 100),
    };
    const attribution = await tx.leadConversionAttribution.upsert({
      where: {
        leadId_opportunityId_model: {
          leadId: input.leadId,
          opportunityId: input.opportunityId,
          model: input.model,
        },
      },
      update: {},
      create: {
        leadId: input.leadId,
        opportunityId: input.opportunityId,
        campaignId: lead.lead.campaignId,
        model: input.model,
        touchpoints: input.touchpoints as Prisma.InputJsonValue,
        dataQuality,
        convertedAt: new Date(),
      },
    });
    await tx.leadGovernance.update({
      where: { id: lead.id },
      data: { stage: 'CONVERTED', version: { increment: 1 }, lastTransitionAt: new Date() },
    });
    await tx.lead.update({ where: { id: input.leadId }, data: { status: 'WON' } });
    await appendLeadAudit(tx, {
      clientId: input.clientId,
      entityType: 'LEAD',
      entityId: input.leadId,
      actorId: input.actorId,
      action: 'LEAD_CONVERTED',
      payload: { opportunityId: input.opportunityId, attributionId: attribution.id, model: input.model, dataQuality },
    });
    return attribution;
  });
}

export async function updateAccountLifecycle(
  db: PrismaClient,
  input: { clientId: string; actorId: string; stage: AccountLifecycleStage; reason: string },
) {
  return db.$transaction(async (tx) => {
    const account = await tx.clientCompany.findUnique({ where: { id: input.clientId } });
    if (!account) throw new LeadOperationsError('CLIENT_NOT_FOUND', 'Client account not found', 404);
    const updated = await tx.clientCompany.update({ where: { id: input.clientId }, data: { lifecycleStage: input.stage } });
    await appendLeadAudit(tx, {
      clientId: input.clientId,
      entityType: 'ACCOUNT',
      entityId: input.clientId,
      actorId: input.actorId,
      action: 'ACCOUNT_STAGE_TRANSITIONED',
      payload: { from: account.lifecycleStage, to: input.stage, reason: input.reason.trim() },
    });
    return updated;
  });
}

export async function createConnector(
  db: PrismaClient,
  input: {
    clientId: string;
    actorId: string;
    serviceUserId: string;
    kind: ConnectorKind;
    provider: string;
    baseUrl: string;
    credentialRef: string;
    webhookSecretRef: string;
    syncDirection: 'INBOUND' | 'OUTBOUND' | 'BOTH';
  },
) {
  let url: URL;
  try { url = new URL(input.baseUrl); } catch { throw new LeadOperationsError('INVALID_CONNECTOR_URL', 'Connector URL is invalid'); }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new LeadOperationsError('INVALID_CONNECTOR_URL', 'Connector URLs must use HTTPS and cannot contain credentials');
  }
  if (!/^[A-Z][A-Z0-9_]{2,80}$/.test(input.credentialRef) || !/^[A-Z][A-Z0-9_]{2,80}$/.test(input.webhookSecretRef)) {
    throw new LeadOperationsError('INVALID_SECRET_REFERENCE', 'Secret references must be uppercase environment variable names');
  }
  return db.$transaction(async (tx) => {
    await assertClientAndOwner(tx, input.clientId, input.serviceUserId);
    const connector = await tx.leadConnector.create({
      data: {
        clientId: input.clientId,
        serviceUserId: input.serviceUserId,
        kind: input.kind,
        provider: normalizeText(input.provider),
        baseUrl: url.toString(),
        credentialRef: input.credentialRef,
        webhookSecretRef: input.webhookSecretRef,
        syncDirection: input.syncDirection,
      },
    });
    await appendLeadAudit(tx, {
      clientId: input.clientId,
      entityType: 'CONNECTOR',
      entityId: connector.id,
      actorId: input.actorId,
      action: 'CONNECTOR_CREATED',
      payload: { kind: connector.kind, provider: connector.provider, baseUrl: connector.baseUrl, syncDirection: connector.syncDirection, serviceUserId: connector.serviceUserId },
    });
    return connector;
  });
}

export async function queueSyncOperation(
  db: PrismaClient,
  input: {
    clientId: string;
    actorId: string;
    connectorId: string;
    direction: 'INBOUND' | 'OUTBOUND';
    entityType: string;
    externalId: string;
    idempotencyKey: string;
    payload: JsonObject;
  },
) {
  const key = safeIdempotencyKey(input.idempotencyKey);
  const entityType = input.entityType.toUpperCase();
  return db.$transaction(async (tx) => {
    const connector = await tx.leadConnector.findUnique({ where: { id: input.connectorId } });
    if (!connector || connector.clientId !== input.clientId || !connector.enabled) {
      throw new LeadOperationsError('CONNECTOR_NOT_FOUND', 'Enabled connector not found', 404);
    }
    if (connector.syncDirection !== 'BOTH' && connector.syncDirection !== input.direction) {
      throw new LeadOperationsError('SYNC_DIRECTION_BLOCKED', 'The connector does not permit this sync direction', 409);
    }
    const hash = payloadHash(input.payload);
    const existing = await tx.leadSyncOperation.findUnique({ where: { idempotencyKey: key } });
    if (existing) {
      if (
        existing.payloadHash !== hash
        || existing.connectorId !== input.connectorId
        || existing.direction !== input.direction
        || existing.entityType !== entityType
        || existing.externalId !== input.externalId
      ) {
        throw new LeadOperationsError('IDEMPOTENCY_CONFLICT', 'The idempotency key was used for a different sync payload', 409);
      }
      return existing;
    }
    const operation = await tx.leadSyncOperation.create({
      data: {
        connectorId: input.connectorId,
        direction: input.direction,
        entityType,
        externalId: input.externalId,
        idempotencyKey: key,
        payload: input.payload as Prisma.InputJsonValue,
        payloadHash: hash,
      },
    });
    await appendLeadAudit(tx, {
      clientId: input.clientId,
      entityType: 'SYNC_OPERATION',
      entityId: operation.id,
      actorId: input.actorId,
      action: 'SYNC_QUEUED',
      payload: { connectorId: input.connectorId, direction: input.direction, entityType: operation.entityType, externalId: input.externalId, payloadHash: hash },
    });
    return operation;
  });
}

export async function retrySyncOperation(
  db: PrismaClient,
  input: { clientId: string; operationId: string; actorId: string; reason: string },
) {
  return db.$transaction(async (tx) => {
    const operation = await tx.leadSyncOperation.findUnique({ where: { id: input.operationId }, include: { connector: true } });
    if (!operation || operation.connector.clientId !== input.clientId) throw new LeadOperationsError('SYNC_NOT_FOUND', 'Sync operation not found', 404);
    if (operation.status !== 'DEAD_LETTER') throw new LeadOperationsError('SYNC_NOT_RETRYABLE', 'Only dead-letter operations can be repaired', 409);
    const updated = await tx.leadSyncOperation.update({
      where: { id: operation.id },
      data: { status: 'RETRY', attempts: 0, nextAttemptAt: new Date(), lastErrorCode: null, leaseOwner: null, leaseUntil: null },
    });
    if (operation.entityType === 'HANDOFF') {
      await tx.leadHandoff.updateMany({
        where: { id: operation.externalId, status: 'DEAD_LETTER' },
        data: { status: 'RETRY', attempts: 0, nextAttemptAt: new Date(), lastErrorCode: null },
      });
    }
    await appendLeadAudit(tx, {
      clientId: input.clientId,
      entityType: 'SYNC_OPERATION',
      entityId: operation.id,
      actorId: input.actorId,
      action: 'SYNC_MANUAL_RETRY',
      payload: { reason: input.reason.trim() },
    });
    return updated;
  });
}

export function rolesAllowedToMutate(): UserRole[] {
  return ['ADMIN', 'ACCOUNT_MANAGER', 'CAMPAIGN_SPECIALIST'];
}
