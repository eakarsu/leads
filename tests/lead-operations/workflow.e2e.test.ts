import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { prisma } from '../../lib/prisma';
import { verifyLeadAuditChain } from '../../lib/lead-operations/audit';
import { LeadOperationsError } from '../../lib/lead-operations/errors';
import { createOptOutToken, applyOptOut } from '../../lib/lead-operations/opt-out';
import {
  captureLead,
  createConnector,
  createOutreach,
  decideHandoff,
  queueSyncOperation,
  recordConsent,
  recordConversion,
  requestHandoff,
  retryOutreach,
  reviewOutreach,
  transitionLead,
  updateAccountLifecycle,
} from '../../lib/lead-operations/service';
import { OutreachProvider, processOneOutreach, processOneSyncOperation } from '../../lib/lead-operations/workers';

const databaseUrl = new URL(process.env.DATABASE_URL || 'postgresql://invalid/invalid');
if (!databaseUrl.pathname.toLowerCase().includes('test')) {
  throw new Error('Lead operations database tests require a database name containing "test"');
}
process.env.PUBLIC_APP_URL = 'http://127.0.0.1:3000';
process.env.OUTREACH_OPT_OUT_SECRET = 'test-opt-out-secret-with-more-than-thirty-two-characters';

class CapturingProvider implements OutreachProvider {
  calls: Array<{ to: string; html: string; key: string }> = [];
  async send(input: { to: string; html: string; idempotencyKey: string }) {
    this.calls.push({ to: input.to, html: input.html, key: input.idempotencyKey });
    return { receipt: `receipt-${this.calls.length}` };
  }
}

test.before(async () => {
  // Workers claim across tenants, so a re-run must not inherit unfinished queue
  // rows from an earlier disposable-test execution.
  await prisma.$transaction([
    prisma.leadSyncOperation.deleteMany(),
    prisma.governedOutreach.deleteMany(),
  ]);
});

test('complete governed lead journey works through real PostgreSQL', async () => {
  const suffix = randomUUID().slice(0, 8);
  const client = await prisma.clientCompany.create({
    data: {
      name: `Workflow client ${suffix}`,
      industry: 'Software',
      contactName: 'Operations Owner',
      contactEmail: `owner-${suffix}@example.com`,
      lifecycleStage: 'ACTIVE_CUSTOMER',
    },
  });
  const secondClient = await prisma.clientCompany.create({
    data: {
      name: `Isolated client ${suffix}`,
      industry: 'Software',
      contactName: 'Other Owner',
      contactEmail: `other-${suffix}@example.com`,
    },
  });
  const [owner, reviewer, recipientOwner] = await Promise.all([
    prisma.user.create({ data: { email: `owner-${suffix}@example.com`, hashedPassword: 'not-used', name: 'Owner', role: 'ACCOUNT_MANAGER', clientId: client.id, emailVerified: true } }),
    prisma.user.create({ data: { email: `reviewer-${suffix}@example.com`, hashedPassword: 'not-used', name: 'Reviewer', role: 'ADMIN', clientId: client.id, emailVerified: true } }),
    prisma.user.create({ data: { email: `recipient-${suffix}@example.com`, hashedPassword: 'not-used', name: 'Recipient owner', role: 'ACCOUNT_MANAGER', clientId: client.id, emailVerified: true } }),
  ]);

  await updateAccountLifecycle(prisma, { clientId: secondClient.id, actorId: reviewer.id, stage: 'SUSPENDED', reason: 'Isolation test account paused' });
  await assert.rejects(
    captureLead(prisma, { clientId: secondClient.id, actorId: reviewer.id, fullName: 'Blocked Lead', email: `blocked-${suffix}@example.com` }),
    (error: unknown) => error instanceof LeadOperationsError && error.code === 'CLIENT_SUSPENDED',
  );

  const captured = await captureLead(prisma, {
    clientId: client.id,
    actorId: owner.id,
    ownerId: owner.id,
    fullName: 'Ada Prospect',
    company: 'Analytical Engines',
    email: `ADA-${suffix}@Example.com`,
    phone: '+1 212 555 0101',
    region: 'US',
    lawfulBasis: 'EXPLICIT_CONSENT',
    source: 'WEB_FORM',
  });
  assert.equal(captured.duplicate, false);
  const duplicate = await captureLead(prisma, {
    clientId: client.id,
    actorId: owner.id,
    fullName: 'Ada Changed Name',
    email: `ada-${suffix}@example.com`,
  });
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.lead.id, captured.lead.id);

  await assert.rejects(
    transitionLead(prisma, { clientId: client.id, leadId: captured.lead.id, actorId: owner.id, expectedVersion: 1, to: 'CONVERTED', reason: 'invalid jump' }),
    (error: unknown) => error instanceof LeadOperationsError && error.code === 'INVALID_TRANSITION',
  );
  let governance = await transitionLead(prisma, { clientId: client.id, leadId: captured.lead.id, actorId: owner.id, expectedVersion: 1, to: 'DEDUPED', reason: 'identity checked' });
  governance = await transitionLead(prisma, { clientId: client.id, leadId: captured.lead.id, actorId: owner.id, expectedVersion: governance.version, to: 'ENRICHED', reason: 'company enrichment checked' });
  await transitionLead(prisma, { clientId: client.id, leadId: captured.lead.id, actorId: owner.id, expectedVersion: governance.version, to: 'REVIEW_PENDING', reason: 'ready for human review' });
  await assert.rejects(
    transitionLead(prisma, { clientId: client.id, leadId: captured.lead.id, actorId: owner.id, expectedVersion: 1, to: 'OUTREACH_APPROVED', reason: 'stale edit' }),
    (error: unknown) => error instanceof LeadOperationsError && error.code === 'VERSION_CONFLICT',
  );

  await recordConsent(prisma, {
    clientId: client.id,
    leadId: captured.lead.id,
    actorId: owner.id,
    channel: 'EMAIL',
    purpose: 'MARKETING',
    region: 'US',
    state: 'GRANTED',
    sourceSystem: 'CONSENT_PORTAL',
    sourceReference: `consent-${suffix}`,
    evidence: { formVersion: 3, checkbox: true },
  });
  const outreach = await createOutreach(prisma, {
    clientId: client.id,
    leadId: captured.lead.id,
    actorId: owner.id,
    channel: 'EMAIL',
    purpose: 'MARKETING',
    region: 'US',
    subject: 'A useful conversation',
    body: '<p>Hello Ada</p>',
    idempotencyKey: `outreach:${suffix}:primary`,
  });
  assert.equal(outreach.state, 'REVIEW_PENDING');
  await assert.rejects(
    createOutreach(prisma, {
      clientId: client.id, leadId: captured.lead.id, actorId: owner.id, channel: 'EMAIL', purpose: 'TRANSACTIONAL', region: 'US',
      subject: 'A useful conversation', body: '<p>Hello Ada</p>', idempotencyKey: `outreach:${suffix}:primary`,
    }),
    (error: unknown) => error instanceof LeadOperationsError && error.code === 'IDEMPOTENCY_CONFLICT',
  );
  await assert.rejects(
    reviewOutreach(prisma, { clientId: client.id, outreachId: outreach.id, reviewerId: owner.id, approve: true, reason: 'looks good' }),
    (error: unknown) => error instanceof LeadOperationsError && error.code === 'SEPARATE_REVIEWER_REQUIRED',
  );
  await reviewOutreach(prisma, { clientId: client.id, outreachId: outreach.id, reviewerId: reviewer.id, approve: true, reason: 'consent and content verified' });

  const provider = new CapturingProvider();
  const results = await Promise.all([
    processOneOutreach(prisma, `worker-a-${suffix}`, provider),
    processOneOutreach(prisma, `worker-b-${suffix}`, provider),
  ]);
  assert.equal(results.filter((result) => result === 'sent').length, 1);
  assert.equal(provider.calls.length, 1, 'lease claiming prevents duplicate delivery');
  assert.match(provider.calls[0].html, /Unsubscribe/);
  const sent = await prisma.governedOutreach.findUniqueOrThrow({ where: { id: outreach.id } });
  assert.equal(sent.state, 'SENT');
  assert.equal(sent.attempts, 1);
  assert.ok(sent.providerReceipt);

  const afterSend = await prisma.leadGovernance.findUniqueOrThrow({ where: { leadId: captured.lead.id } });
  assert.equal(afterSend.stage, 'CONTACTED');
  await transitionLead(prisma, { clientId: client.id, leadId: captured.lead.id, actorId: owner.id, expectedVersion: afterSend.version, to: 'QUALIFIED', reason: 'sales qualification completed' });
  const handoff = await requestHandoff(prisma, { clientId: client.id, leadId: captured.lead.id, actorId: owner.id, toOwnerId: recipientOwner.id });
  await assert.rejects(
    decideHandoff(prisma, { clientId: client.id, handoffId: handoff.id, actorId: owner.id, approve: true, reason: 'self approval' }),
    (error: unknown) => error instanceof LeadOperationsError && error.code === 'SEPARATE_REVIEWER_REQUIRED',
  );
  await decideHandoff(prisma, { clientId: client.id, handoffId: handoff.id, actorId: reviewer.id, approve: true, reason: 'handoff package verified' });
  const handedOff = await prisma.leadGovernance.findUniqueOrThrow({ where: { leadId: captured.lead.id } });
  assert.equal(handedOff.stage, 'HANDED_OFF');
  assert.equal(handedOff.ownerId, recipientOwner.id);

  const opportunity = await prisma.opportunity.create({
    data: { clientId: client.id, leadId: captured.lead.id, name: 'Qualified opportunity', ownerId: recipientOwner.id, stage: 'CLOSED_WON', amount: 12500, probability: 100 },
  });
  const attribution = await recordConversion(prisma, {
    clientId: client.id,
    leadId: captured.lead.id,
    opportunityId: opportunity.id,
    actorId: reviewer.id,
    model: 'POSITION_BASED',
    touchpoints: [{ kind: 'WEB_FORM' }, { kind: 'OUTREACH', outreachId: outreach.id }],
  });
  const quality = attribution.dataQuality as Record<string, unknown>;
  assert.equal(quality.sentOutreach, 1);
  assert.ok(typeof quality.completenessPercent === 'number' && quality.completenessPercent >= 60);

  const optOutToken = createOptOutToken(outreach.id);
  await applyOptOut(prisma, optOutToken);
  await applyOptOut(prisma, optOutToken);
  const convertedStill = await prisma.leadGovernance.findUniqueOrThrow({ where: { leadId: captured.lead.id } });
  assert.equal(convertedStill.stage, 'CONVERTED', 'opt-out does not erase the conversion lifecycle state');
  const suppression = await prisma.leadSuppression.count({ where: { clientId: client.id, channel: 'EMAIL' } });
  assert.equal(suppression, 1);
  const optOutEvidence = await prisma.leadConsent.count({
    where: { leadId: captured.lead.id, sourceSystem: 'ONE_CLICK_OPT_OUT', sourceReference: outreach.id },
  });
  assert.equal(optOutEvidence, 1, 'replayed opt-out requests do not duplicate immutable evidence');

  const connector = await createConnector(prisma, {
    clientId: client.id,
    actorId: reviewer.id,
    serviceUserId: owner.id,
    kind: 'CRM',
    provider: 'test crm',
    baseUrl: 'https://crm.example.com/lead-sync',
    credentialRef: 'CRM_TEST_TOKEN',
    webhookSecretRef: 'CRM_TEST_WEBHOOK_SECRET',
    syncDirection: 'BOTH',
  });
  const inboundPayload = {
    fullName: 'Grace Synced',
    company: 'Compiler Company',
    email: `grace-${suffix}@example.com`,
    sourceUpdatedAt: new Date().toISOString(),
    externalVersion: 'v1',
    region: 'US',
  };
  const sync = await queueSyncOperation(prisma, {
    clientId: client.id,
    actorId: owner.id,
    connectorId: connector.id,
    direction: 'INBOUND',
    entityType: 'LEAD',
    externalId: `crm-${suffix}`,
    idempotencyKey: `sync:${suffix}:v1`,
    payload: inboundPayload,
  });
  const sameSync = await queueSyncOperation(prisma, {
    clientId: client.id,
    actorId: owner.id,
    connectorId: connector.id,
    direction: 'INBOUND',
    entityType: 'LEAD',
    externalId: `crm-${suffix}`,
    idempotencyKey: `sync:${suffix}:v1`,
    payload: inboundPayload,
  });
  assert.equal(sameSync.id, sync.id);
  await assert.rejects(
    queueSyncOperation(prisma, {
      clientId: client.id,
      actorId: owner.id,
      connectorId: connector.id,
      direction: 'INBOUND',
      entityType: 'LEAD',
      externalId: `crm-other-${suffix}`,
      idempotencyKey: `sync:${suffix}:v1`,
      payload: inboundPayload,
    }),
    (error: unknown) => error instanceof LeadOperationsError && error.code === 'IDEMPOTENCY_CONFLICT',
  );
  assert.equal(await processOneSyncOperation(prisma, `sync-worker-${suffix}`), 'completed');
  const mapping = await prisma.leadSyncRecord.findUniqueOrThrow({ where: { connectorId_externalId: { connectorId: connector.id, externalId: `crm-${suffix}` } }, include: { lead: true } });
  assert.equal(mapping.lead.email, `grace-${suffix}@example.com`);

  await queueSyncOperation(prisma, {
    clientId: client.id,
    actorId: owner.id,
    connectorId: connector.id,
    direction: 'INBOUND',
    entityType: 'LEAD',
    externalId: `crm-${suffix}`,
    idempotencyKey: `sync:${suffix}:stale`,
    payload: { ...inboundPayload, externalVersion: 'v0', sourceUpdatedAt: new Date(Date.now() - 86_400_000).toISOString() },
  });
  assert.equal(await processOneSyncOperation(prisma, `sync-worker-stale-${suffix}`), 'dead-letter');

  const auditOkay = await prisma.$transaction((tx) => verifyLeadAuditChain(tx, 'LEAD', captured.lead.id));
  assert.equal(auditOkay, true);
  const audit = await prisma.leadOperationsAudit.findFirstOrThrow({ where: { entityType: 'LEAD', entityId: captured.lead.id } });
  await assert.rejects(prisma.leadOperationsAudit.update({ where: { id: audit.id }, data: { action: 'TAMPERED' } }));
});

test('worker retries are bounded, manually repairable, and rate limited', async () => {
  const suffix = randomUUID().slice(0, 8);
  const client = await prisma.clientCompany.create({
    data: { name: `Retry client ${suffix}`, industry: 'Services', contactName: 'Retry Owner', contactEmail: `retry-${suffix}@example.com`, lifecycleStage: 'ACTIVE_CUSTOMER' },
  });
  const owner = await prisma.user.create({ data: { email: `retry-owner-${suffix}@example.com`, hashedPassword: 'unused', name: 'Retry owner', role: 'ACCOUNT_MANAGER', clientId: client.id, emailVerified: true } });
  const reviewer = await prisma.user.create({ data: { email: `retry-reviewer-${suffix}@example.com`, hashedPassword: 'unused', name: 'Retry reviewer', role: 'ADMIN', clientId: client.id, emailVerified: true } });
  const captured = await captureLead(prisma, { clientId: client.id, actorId: owner.id, fullName: 'Retry Prospect', email: `retry-prospect-${suffix}@example.com`, company: 'Reliable Systems' });
  await transitionLead(prisma, { clientId: client.id, leadId: captured.lead.id, actorId: owner.id, expectedVersion: 1, to: 'REVIEW_PENDING', reason: 'identity manually reviewed' });
  await recordConsent(prisma, {
    clientId: client.id, leadId: captured.lead.id, actorId: owner.id, channel: 'EMAIL', purpose: 'MARKETING', region: 'US', state: 'GRANTED',
    sourceSystem: 'CONSENT_PORTAL', sourceReference: `retry-consent-${suffix}`, evidence: { accepted: true },
  });
  const outreach = await createOutreach(prisma, {
    clientId: client.id, leadId: captured.lead.id, actorId: owner.id, channel: 'EMAIL', purpose: 'MARKETING', region: 'US',
    subject: 'Retry test', body: '<p>retry</p>', idempotencyKey: `outreach:${suffix}:retry`,
  });
  await reviewOutreach(prisma, { clientId: client.id, outreachId: outreach.id, reviewerId: reviewer.id, approve: true, reason: 'content reviewed' });
  const failing: OutreachProvider = {
    async send() { throw new LeadOperationsError('TEMPORARY_PROVIDER_FAILURE', 'temporary provider failure', 502, true); },
  };
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    await prisma.governedOutreach.update({ where: { id: outreach.id }, data: { nextAttemptAt: new Date() } });
    const result = await processOneOutreach(prisma, `retry-worker-${suffix}-${attempt}`, failing);
    assert.equal(result, attempt < 5 ? 'retry' : 'dead-letter');
  }
  const dead = await prisma.governedOutreach.findUniqueOrThrow({ where: { id: outreach.id } });
  assert.equal(dead.state, 'DEAD_LETTER');
  assert.equal(dead.attempts, 5);
  await retryOutreach(prisma, { clientId: client.id, outreachId: outreach.id, actorId: reviewer.id, reason: 'provider configuration repaired' });
  const provider = new CapturingProvider();
  assert.equal(await processOneOutreach(prisma, `repaired-worker-${suffix}`, provider), 'sent');
  assert.equal(provider.calls.length, 1);

  await prisma.outreachPolicy.create({
    data: {
      clientId: client.id, region: 'US', channel: 'EMAIL', requireConsent: true, requireHumanReview: true,
      maxPerHour: 1, maxPerDay: 1, quietHoursStart: 0, quietHoursEnd: 0, timezone: 'UTC',
    },
  });
  const second = await captureLead(prisma, { clientId: client.id, actorId: owner.id, fullName: 'Rate Limited Prospect', email: `rate-${suffix}@example.com`, company: 'Reliable Systems' });
  await transitionLead(prisma, { clientId: client.id, leadId: second.lead.id, actorId: owner.id, expectedVersion: 1, to: 'REVIEW_PENDING', reason: 'identity manually reviewed' });
  await recordConsent(prisma, {
    clientId: client.id, leadId: second.lead.id, actorId: owner.id, channel: 'EMAIL', purpose: 'MARKETING', region: 'US', state: 'GRANTED',
    sourceSystem: 'CONSENT_PORTAL', sourceReference: `rate-consent-${suffix}`, evidence: { accepted: true },
  });
  const rateLimited = await createOutreach(prisma, {
    clientId: client.id, leadId: second.lead.id, actorId: owner.id, channel: 'EMAIL', purpose: 'MARKETING', region: 'US',
    subject: 'Rate policy test', body: '<p>rate</p>', idempotencyKey: `outreach:${suffix}:rate`,
  });
  await reviewOutreach(prisma, { clientId: client.id, outreachId: rateLimited.id, reviewerId: reviewer.id, approve: true, reason: 'content reviewed' });
  assert.equal(await processOneOutreach(prisma, `rate-worker-${suffix}`, provider), 'retry');
  assert.equal(provider.calls.length, 1, 'rate-limited outreach never reaches the provider');
  const deferred = await prisma.governedOutreach.findUniqueOrThrow({ where: { id: rateLimited.id } });
  assert.equal(deferred.lastErrorCode, 'HOURLY_RATE_LIMIT,DAILY_RATE_LIMIT');
});

test.after(async () => {
  await prisma.$disconnect();
});
