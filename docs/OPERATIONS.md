# Operations runbook

## Process separation

- `npm run db:migrate:deploy` applies checked-in Prisma migrations. Run it as an explicit release step.
- `npm run db:provision` creates the first client and administrator once, then refuses future use.
- `./start.sh` starts an existing production build only.
- `npm run worker` claims outreach and sync work with PostgreSQL `FOR UPDATE SKIP LOCKED` leases.
- `npm run worker:once` processes at most one item from each queue and is useful for controlled diagnosis.

Do not point development or test commands at a shared production database. The automated database suite additionally requires `test` in the database name.

## Required secrets

- `NEXTAUTH_SECRET`: at least 32 random characters.
- `OUTREACH_OPT_OUT_SECRET`: at least 32 random characters; rotate only after allowing issued opt-out links to expire.
- `RESEND_API_KEY` and `EMAIL_FROM`: required by the email worker.
- connector credential and webhook variables: their names are stored in connector rows; values stay in the process secret store.

Set `CONNECTOR_ALLOWED_HOSTS` to a comma-separated production allowlist. Connector delivery requires HTTPS, rejects embedded credentials, local/private/reserved destinations, non-standard ports, redirects, long responses, and ten-second timeouts.

Revoke all existing JWT sessions for a user after a role, password, or incident response change:

```bash
npm run auth:revoke -- USER_UUID
```

Suspending or disabling a user also invalidates authorization on the next session check.

## Queue recovery

Outreach and sync workers reclaim expired leases. A worker can only complete a row while its lease owner still matches, so a stale worker cannot overwrite a newer result.

- transient provider failures use bounded exponential retry;
- policy limits and quiet hours defer delivery without counting a provider attempt;
- revoked consent, suppression, missing approval, and missing destinations block delivery before the provider call;
- exhausted or non-retryable failures enter `DEAD_LETTER`;
- an administrator or account manager records the repair reason before manually retrying.

Never edit queue state directly. Use the Outreach Review and Sync & Policies screens or their authenticated repair endpoints so the action enters the audit chain.

## Health and release checks

- `GET /api/health/live` checks the web process.
- `GET /api/health/ready` checks database access and verifies the latest expected migration.

Readiness must pass before routing traffic. A migration rollback is a new forward migration; do not modify a migration already applied outside a disposable environment.

## Backup and restore

Use custom-format PostgreSQL backups:

```bash
npm run db:backup -- /absolute/path/leads.dump
npm run db:restore -- /absolute/path/leads.dump RESTORE_CONFIRMED
```

Restore is intentionally explicit and destructive. Practice it against a new database, then verify `npm run db:migrate:status`, readiness, record counts, and audit-chain checks before treating a backup as usable.

## Incident checklist

1. disable the affected connector or suspend the affected user/account;
2. revoke sessions and rotate externally stored credentials;
3. preserve `lead_operations_audit`, consent, queue, and provider receipts;
4. inspect dead letters without replaying them;
5. repair configuration and use the reviewed retry action;
6. confirm delivery, sync cursors, suppression, attribution, and audit continuity.
