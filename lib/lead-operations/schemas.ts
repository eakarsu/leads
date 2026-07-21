import { z } from 'zod';

export const captureLeadSchema = z.object({
  clientId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  campaignId: z.string().uuid().nullable().optional(),
  fullName: z.string().trim().min(2).max(160),
  company: z.string().trim().max(200).nullable().optional(),
  title: z.string().trim().max(200).nullable().optional(),
  email: z.string().trim().max(254).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  source: z.string().trim().max(120).nullable().optional(),
  region: z.string().trim().min(2).max(20).optional(),
  lawfulBasis: z.string().trim().max(120).nullable().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const transitionSchema = z.object({
  clientId: z.string().uuid().optional(),
  expectedVersion: z.number().int().positive(),
  to: z.enum(['CAPTURED', 'DEDUPED', 'ENRICHED', 'REVIEW_PENDING', 'OUTREACH_APPROVED', 'CONTACTED', 'ENGAGED', 'QUALIFIED', 'HANDOFF_PENDING', 'HANDED_OFF', 'RETRY_PENDING', 'CONVERTED', 'DISQUALIFIED', 'SUPPRESSED']),
  reason: z.string().trim().min(3).max(1000),
}).strict();

export const consentSchema = z.object({
  clientId: z.string().uuid().optional(),
  channel: z.enum(['EMAIL', 'SMS', 'PHONE']),
  purpose: z.string().trim().min(2).max(80).transform((value) => value.toUpperCase()),
  region: z.string().trim().min(2).max(20),
  state: z.enum(['PENDING', 'GRANTED', 'DENIED', 'REVOKED', 'EXPIRED']),
  sourceSystem: z.string().trim().min(2).max(120),
  sourceReference: z.string().trim().min(1).max(250),
  evidence: z.record(z.string(), z.unknown()),
  effectiveAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
}).strict();

export const outreachSchema = z.object({
  clientId: z.string().uuid().optional(),
  leadId: z.string().uuid(),
  channel: z.enum(['EMAIL']),
  purpose: z.string().trim().min(2).max(80),
  region: z.string().trim().min(2).max(20),
  subject: z.string().trim().max(998).nullable().optional(),
  body: z.string().min(1).max(100_000),
  idempotencyKey: z.string().min(8).max(200),
  scheduledAt: z.coerce.date().nullable().optional(),
}).strict();

export const connectorSchema = z.object({
  clientId: z.string().uuid().optional(),
  serviceUserId: z.string().uuid(),
  kind: z.enum(['CRM', 'EMAIL', 'CALENDAR', 'ENRICHMENT', 'CONSENT', 'SUPPRESSION']),
  provider: z.string().trim().min(2).max(80),
  baseUrl: z.string().url().max(2048),
  credentialRef: z.string().min(3).max(80),
  webhookSecretRef: z.string().min(3).max(80),
  syncDirection: z.enum(['INBOUND', 'OUTBOUND', 'BOTH']),
}).strict();

export const queueSyncSchema = z.object({
  clientId: z.string().uuid().optional(),
  connectorId: z.string().uuid(),
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  entityType: z.string().trim().min(2).max(80),
  externalId: z.string().trim().min(1).max(250),
  idempotencyKey: z.string().min(8).max(200),
  payload: z.record(z.string(), z.unknown()),
}).strict();
