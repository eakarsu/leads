CREATE TYPE "UserStatus" AS ENUM ('ACTIVE','SUSPENDED','DISABLED');
CREATE TYPE "AccountLifecycleStage" AS ENUM ('PROSPECT','ACTIVE_CUSTOMER','PARTNER','SUSPENDED','ARCHIVED');
CREATE TYPE "GovernedLeadStage" AS ENUM ('CAPTURED','DEDUPED','ENRICHED','REVIEW_PENDING','OUTREACH_APPROVED','CONTACTED','ENGAGED','QUALIFIED','HANDOFF_PENDING','HANDED_OFF','RETRY_PENDING','CONVERTED','DISQUALIFIED','SUPPRESSED');
CREATE TYPE "ConnectorKind" AS ENUM ('CRM','EMAIL','CALENDAR','ENRICHMENT','CONSENT','SUPPRESSION');
CREATE TYPE "SyncOperationStatus" AS ENUM ('PENDING','LEASED','RETRY','COMPLETED','DEAD_LETTER');
CREATE TYPE "ConsentState" AS ENUM ('PENDING','GRANTED','DENIED','REVOKED','EXPIRED');
CREATE TYPE "OutreachState" AS ENUM ('DRAFT','REVIEW_PENDING','APPROVED','BLOCKED','SENDING','SENT','RETRY','DEAD_LETTER','CANCELLED');
CREATE TYPE "LeadHandoffStatus" AS ENUM ('PENDING','APPROVED','REJECTED','RETRY','DEAD_LETTER','COMPLETED','CANCELLED');

ALTER TABLE "users" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 1 CHECK ("authVersion" > 0);
ALTER TABLE "client_companies" ADD COLUMN "lifecycleStage" "AccountLifecycleStage" NOT NULL DEFAULT 'PROSPECT',
  ADD COLUMN "defaultRegion" TEXT NOT NULL DEFAULT 'US',
  ADD COLUMN "maxOutreachPerHour" INTEGER NOT NULL DEFAULT 50 CHECK ("maxOutreachPerHour" > 0),
  ADD COLUMN "maxOutreachPerDay" INTEGER NOT NULL DEFAULT 250 CHECK ("maxOutreachPerDay" > 0);

CREATE TABLE "lead_governance" (
  "id" TEXT PRIMARY KEY,
  "leadId" TEXT NOT NULL UNIQUE REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "clientId" TEXT NOT NULL REFERENCES "client_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "stage" "GovernedLeadStage" NOT NULL DEFAULT 'CAPTURED',
  "ownerId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "version" INTEGER NOT NULL DEFAULT 1 CHECK ("version" > 0),
  "dedupeKey" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "lawfulBasis" TEXT,
  "approvalRequired" BOOLEAN NOT NULL DEFAULT TRUE,
  "handedOffAt" TIMESTAMP(3),
  "handedOffTo" TEXT,
  "lastTransitionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "lead_governance_ownerId_stage_idx" ON "lead_governance" ("ownerId", "stage");
ALTER TABLE "lead_governance" ADD CONSTRAINT "lead_governance_clientId_dedupeKey_key" UNIQUE ("clientId", "dedupeKey");

CREATE TABLE "lead_connectors" (
  "id" TEXT PRIMARY KEY,
  "clientId" TEXT NOT NULL REFERENCES "client_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "serviceUserId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "kind" "ConnectorKind" NOT NULL,
  "provider" TEXT NOT NULL,
  "baseUrl" TEXT NOT NULL CHECK ("baseUrl" LIKE 'https://%'),
  "credentialRef" TEXT NOT NULL,
  "webhookSecretRef" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "syncDirection" TEXT NOT NULL DEFAULT 'BOTH' CHECK ("syncDirection" IN ('INBOUND','OUTBOUND','BOTH')),
  "cursor" TEXT,
  "lastSucceededAt" TIMESTAMP(3),
  "consecutiveFailures" INTEGER NOT NULL DEFAULT 0 CHECK ("consecutiveFailures" >= 0),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lead_connectors_clientId_kind_provider_key" UNIQUE ("clientId", "kind", "provider")
);
CREATE INDEX "lead_connectors_clientId_enabled_idx" ON "lead_connectors" ("clientId", "enabled");

CREATE TABLE "lead_sync_records" (
  "id" TEXT PRIMARY KEY,
  "connectorId" TEXT NOT NULL REFERENCES "lead_connectors"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "leadId" TEXT NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "externalId" TEXT NOT NULL,
  "externalVersion" TEXT NOT NULL,
  "sourceUpdatedAt" TIMESTAMP(3) NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "lastInboundAt" TIMESTAMP(3),
  "lastOutboundAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lead_sync_records_connectorId_externalId_key" UNIQUE ("connectorId", "externalId")
);
CREATE INDEX "lead_sync_records_leadId_idx" ON "lead_sync_records" ("leadId");
CREATE INDEX "lead_sync_records_connectorId_leadId_idx" ON "lead_sync_records" ("connectorId", "leadId");

CREATE TABLE "lead_sync_operations" (
  "id" TEXT PRIMARY KEY,
  "connectorId" TEXT NOT NULL REFERENCES "lead_connectors"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "direction" TEXT NOT NULL CHECK ("direction" IN ('INBOUND','OUTBOUND')),
  "entityType" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL UNIQUE,
  "payload" JSONB NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "status" "SyncOperationStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0 CHECK ("attempts" >= 0),
  "maxAttempts" INTEGER NOT NULL DEFAULT 5 CHECK ("maxAttempts" BETWEEN 1 AND 20),
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leaseOwner" TEXT,
  "leaseUntil" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "providerReceipt" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "lead_sync_operations_status_nextAttemptAt_idx" ON "lead_sync_operations" ("status", "nextAttemptAt");
CREATE INDEX "lead_sync_operations_connectorId_externalId_idx" ON "lead_sync_operations" ("connectorId", "externalId");

CREATE TABLE "lead_consents" (
  "id" TEXT PRIMARY KEY,
  "leadId" TEXT NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "channel" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "state" "ConsentState" NOT NULL,
  "sourceSystem" TEXT NOT NULL,
  "sourceReference" TEXT NOT NULL,
  "evidenceHash" TEXT NOT NULL,
  "effectiveAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "lead_consents_leadId_channel_purpose_effectiveAt_idx" ON "lead_consents" ("leadId", "channel", "purpose", "effectiveAt");

CREATE TABLE "lead_suppressions" (
  "id" TEXT PRIMARY KEY,
  "clientId" TEXT NOT NULL REFERENCES "client_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "channel" TEXT NOT NULL,
  "normalizedHash" TEXT NOT NULL,
  "region" TEXT,
  "reason" TEXT NOT NULL,
  "sourceSystem" TEXT NOT NULL,
  "sourceReference" TEXT NOT NULL,
  "effectiveAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_suppressions_clientId_channel_normalizedHash_key" UNIQUE ("clientId", "channel", "normalizedHash")
);
CREATE INDEX "lead_suppressions_normalizedHash_effectiveAt_idx" ON "lead_suppressions" ("normalizedHash", "effectiveAt");

CREATE TABLE "governed_outreach" (
  "id" TEXT PRIMARY KEY,
  "leadId" TEXT NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "channel" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "state" "OutreachState" NOT NULL DEFAULT 'DRAFT',
  "createdBy" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "approvedBy" TEXT REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "approvedAt" TIMESTAMP(3),
  "idempotencyKey" TEXT NOT NULL UNIQUE,
  "provider" TEXT,
  "providerReceipt" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0 CHECK ("attempts" >= 0),
  "maxAttempts" INTEGER NOT NULL DEFAULT 5 CHECK ("maxAttempts" BETWEEN 1 AND 20),
  "scheduledAt" TIMESTAMP(3),
  "nextAttemptAt" TIMESTAMP(3),
  "leaseOwner" TEXT,
  "leaseUntil" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CHECK ("approvedBy" IS NULL OR "approvedBy" <> "createdBy")
);
CREATE INDEX "governed_outreach_leadId_state_idx" ON "governed_outreach" ("leadId", "state");
CREATE INDEX "governed_outreach_state_nextAttemptAt_idx" ON "governed_outreach" ("state", "nextAttemptAt");

CREATE TABLE "lead_handoffs" (
  "id" TEXT PRIMARY KEY,
  "leadId" TEXT NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "clientId" TEXT NOT NULL REFERENCES "client_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "fromOwnerId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "toOwnerId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "targetConnectorId" TEXT REFERENCES "lead_connectors"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "status" "LeadHandoffStatus" NOT NULL DEFAULT 'PENDING',
  "requestedBy" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "decidedBy" TEXT REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "decisionReason" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0 CHECK ("attempts" >= 0),
  "maxAttempts" INTEGER NOT NULL DEFAULT 5 CHECK ("maxAttempts" BETWEEN 1 AND 20),
  "nextAttemptAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "lead_handoffs_leadId_status_idx" ON "lead_handoffs" ("leadId", "status");
CREATE INDEX "lead_handoffs_clientId_status_nextAttemptAt_idx" ON "lead_handoffs" ("clientId", "status", "nextAttemptAt");

CREATE TABLE "outreach_policies" (
  "id" TEXT PRIMARY KEY,
  "clientId" TEXT NOT NULL REFERENCES "client_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "region" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "requireConsent" BOOLEAN NOT NULL DEFAULT TRUE,
  "requireHumanReview" BOOLEAN NOT NULL DEFAULT TRUE,
  "maxPerHour" INTEGER NOT NULL DEFAULT 50 CHECK ("maxPerHour" > 0),
  "maxPerDay" INTEGER NOT NULL DEFAULT 250 CHECK ("maxPerDay" > 0),
  "quietHoursStart" INTEGER NOT NULL DEFAULT 20 CHECK ("quietHoursStart" BETWEEN 0 AND 23),
  "quietHoursEnd" INTEGER NOT NULL DEFAULT 8 CHECK ("quietHoursEnd" BETWEEN 0 AND 23),
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "outreach_policies_clientId_region_channel_key" UNIQUE ("clientId", "region", "channel")
);
CREATE INDEX "outreach_policies_clientId_enabled_idx" ON "outreach_policies" ("clientId", "enabled");

CREATE TABLE "lead_conversion_attribution" (
  "id" TEXT PRIMARY KEY,
  "leadId" TEXT NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "opportunityId" TEXT NOT NULL REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "campaignId" TEXT,
  "outreachId" TEXT,
  "model" TEXT NOT NULL,
  "touchpoints" JSONB NOT NULL,
  "dataQuality" JSONB NOT NULL,
  "convertedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_conversion_attribution_leadId_opportunityId_model_key" UNIQUE ("leadId", "opportunityId", "model")
);
CREATE INDEX "lead_conversion_attribution_campaignId_convertedAt_idx" ON "lead_conversion_attribution" ("campaignId", "convertedAt");

CREATE TABLE "lead_operations_audit" (
  "id" TEXT PRIMARY KEY,
  "clientId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL CHECK ("sequence" > 0),
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "previousHash" TEXT NOT NULL,
  "eventHash" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_operations_audit_entityType_entityId_sequence_key" UNIQUE ("entityType", "entityId", "sequence")
);
CREATE INDEX "lead_operations_audit_clientId_createdAt_idx" ON "lead_operations_audit" ("clientId", "createdAt");

CREATE OR REPLACE FUNCTION reject_lead_operations_evidence_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'lead operations evidence is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lead_operations_audit_immutable
BEFORE UPDATE OR DELETE ON "lead_operations_audit"
FOR EACH ROW EXECUTE FUNCTION reject_lead_operations_evidence_mutation();

CREATE TRIGGER lead_consents_immutable
BEFORE UPDATE OR DELETE ON "lead_consents"
FOR EACH ROW EXECUTE FUNCTION reject_lead_operations_evidence_mutation();

-- These models predated migration coverage; create them here so a fresh deploy
-- matches the checked-in Prisma schema instead of relying on `db push`.
CREATE TABLE "webhook_subscriptions" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "url" TEXT NOT NULL,
  "events" TEXT[],
  "secret" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "webhook_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "webhook_deliveries" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "statusCode" INTEGER,
  "responseBody" TEXT,
  "success" BOOLEAN NOT NULL DEFAULT false,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextRetryAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "webhook_deliveries_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "webhook_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "webhook_subscriptions_isActive_idx" ON "webhook_subscriptions"("isActive");
CREATE INDEX "webhook_deliveries_subscriptionId_idx" ON "webhook_deliveries"("subscriptionId");
CREATE INDEX "webhook_deliveries_eventType_idx" ON "webhook_deliveries"("eventType");
CREATE INDEX "webhook_deliveries_success_idx" ON "webhook_deliveries"("success");
CREATE INDEX "webhook_deliveries_nextRetryAt_idx" ON "webhook_deliveries"("nextRetryAt");
