# Connector contracts

Every connector belongs to one client, has a dedicated active service user, a direction (`INBOUND`, `OUTBOUND`, or `BOTH`), an HTTPS endpoint, and names of externally stored credential/webhook secrets. Supported kinds are CRM, email, calendar, enrichment, consent, and suppression.

## Signed inbound delivery

Send JSON to:

```text
POST /api/lead-operations/webhooks/{connectorId}
```

Required headers:

- `x-sync-timestamp`: current Unix timestamp in seconds, within five minutes;
- `x-sync-signature`: hex HMAC-SHA256 of `{timestamp}.{rawBody}` using the connector webhook secret;
- `x-external-id`: stable provider record ID;
- `idempotency-key`: stable key for this provider event/version.

Bodies are limited to 1 MiB. Reusing a key with different content returns a conflict. Workers verify the stored payload hash before applying it.

All inbound records include `sourceUpdatedAt` and `externalVersion`. Older source versions are dead-lettered rather than overwriting newer data.

### CRM

```json
{
  "entityType": "LEAD",
  "fullName": "Ada Prospect",
  "email": "ada@example.com",
  "phone": "+12125550101",
  "company": "Analytical Engines",
  "region": "US",
  "lawfulBasis": "EXPLICIT_CONSENT",
  "sourceUpdatedAt": "2026-07-20T00:00:00Z",
  "externalVersion": "42"
}
```

CRM identities map external IDs to deduplicated internal leads. Multiple external aliases may map to one lead; one external ID cannot map to multiple leads.

### Enrichment, email, and calendar

Provide `leadId`, `leadExternalId`, or a matching lead email plus source version fields. Enrichment appends source/hash evidence and advances eligible captured leads. Email and calendar events append real lead activities; they do not invent successful delivery.

### Consent

Provide `channel`, `purpose`, `region`, `state`, `evidence`, and source version fields. Consent evidence is append-only. `DENIED` or `REVOKED` also creates suppression and blocks queued outreach.

### Suppression

Provide `channel`, `destination`, `reason`, optional `region`/`expiresAt`, and source version fields. Destinations are normalized and stored as hashes in the suppression table.

## Outbound delivery

Outbound sync uses bearer credentials from the connector secret reference and an `Idempotency-Key` header. Redirects are rejected. Success requires a 2xx response; a provider request/receipt header or JSON `id`/`receipt` is retained. Retryable responses are 408, 429, and 5xx.

CRM receives immutable lead snapshots keyed by lead/version. Approved connector-backed handoffs become complete only after the outbound operation succeeds.
