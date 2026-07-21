# Lead Operations

Lead Operations is a governed lead-to-conversion application. Its supported production journey is:

1. capture and deterministically deduplicate a lead inside one client account;
2. append consent or suppression evidence from operators and signed external sources;
3. move the lead through an optimistic, audited lifecycle;
4. draft outreach, obtain approval from a different human, and deliver through a leased worker;
5. synchronize CRM, email, calendar, enrichment, consent, and suppression records bidirectionally;
6. approve ownership handoff, retry failed integrations, and record conversion attribution and data quality.

Generated feature-gap pages, demo credentials, runtime seed endpoints, generic LLM behavior, direct mass-email delivery, and destructive bootstrap behavior were removed. The application does not create users or sample records at startup.
The request boundary exposes only this governed journey; legacy scaffold routes that remain as historical source are not reachable in the deployed product.

## Local setup

Requirements: Node.js 22, PostgreSQL 17, and npm.

```bash
export DATABASE_URL='postgresql://app_user:password@127.0.0.1:5432/lead_operations'
npm ci
npx prisma generate
npm run db:migrate:deploy
npm run db:provision
npm run build
./start.sh
```

`db:provision` is a one-time, fail-closed command. Supply `PROVISION_ADMIN_EMAIL`, `PROVISION_ADMIN_PASSWORD`, `PROVISION_ADMIN_NAME`, and `PROVISION_COMPANY_NAME` in the process environment. It refuses to run after any user exists.

Run the delivery and sync worker separately:

```bash
npm run worker
```

Startup never installs dependencies, copies environment files, kills processes, migrates, provisions, seeds, or starts a development server. Migration, provisioning, web, and worker processes are separate operational steps.

## Verification

```bash
npx prisma generate
npm run db:migrate:deploy
npm test
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=high
```

Database tests refuse to run unless the database name contains `test`. CI applies all migrations to a fresh PostgreSQL service, replays them as a no-op, runs the governed workflow and failure-path tests, builds the app and container, and scans repository history for secrets.

See [operations](docs/OPERATIONS.md) and [connector contracts](docs/CONNECTORS.md).
