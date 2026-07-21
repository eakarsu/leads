# Completeness Review: leads

**Review date:** 2026-07-18

## Assessment basis

Static inspection of project-owned source and configuration only; no dependency installation, build, database migration, external-service call, or runtime launch was performed. The scan considered 568 project files (503 source files), 1 manifest(s), 2 test-like file(s), and 0 CI workflow(s), excluding dependency/generated directories.

## Classification

**Functional but incomplete**

This is a substantive but unfinished sales/customer operations application, not just an empty scaffold. Inspection found 503 source files across `app/`, `prisma/`, `components/`, `lib/` using Next.js, React, Prisma; however, the checked-in workflow and delivery controls do not yet demonstrate a complete, production-operable product.

## Why it is not complete

- Generated gap/visualization routes describe missing capabilities or simulate recommendations; they do not implement the underlying domain operation.
- Generic LLM calls are used as product behavior without enough typed tools, grounded evidence, deterministic rules, or output evaluation.
- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- Only 2 test-like file(s) were found, too little evidence for the breadth of the implemented workflow.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.

## Needed features

1. Integrate CRM, email/calendar, enrichment, consent, and suppression sources with bidirectional, deduplicated sync.
2. Implement explicit lead/account lifecycle, ownership, approvals, attribution, and handoff/retry states.
3. Add deliverability, opt-out, regional privacy, rate-limit, and human-review controls for automated outreach.
4. Measure conversion and data quality with representative end-to-end workflow tests rather than generated sample records.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- Credential/configuration exposure: environment files are present in the repository tree and must be checked against Git history and rotated if real.
- Weak/fallback secret patterns can permit forged sessions or accidental insecure deployments.
- Automation contains destructive process, filesystem, or database operations; do not run it on a shared machine without review.
- Startup appears coupled to seed/migration behavior, risking data mutation or non-repeatable launches.

## Evidence inspected

- `docs/README.md`
- `docs/prompt-beauty-wellness-ai.md:1474`
- `components/GapFeaturePage.tsx:7`
- `app/error.tsx`
- `test-login-ui.spec.ts`
- `package.json`

## Recommended next action

Choose one real sales/customer operations journey, define acceptance criteria and external contracts, then close its persistence, permission, integration, failure, and test gaps before expanding features.

## Implementation progress (2026-07-20)

**Status: source-complete for the governed lead-to-conversion journey described in this review.**

- Added tenant-scoped, deterministic lead capture and deduplication; optimistic lifecycle/version transitions; account suspension controls; reviewed ownership handoff; conversion attribution; data-quality measurement; and an immutable, hash-chained operations audit trail.
- Added explicit CRM, email, calendar, enrichment, consent, and suppression connectors with signed/idempotent inbound webhooks, external identity/version mapping, outbound snapshots, configured active service identities, secret references, stale-update protection, lease-safe queue claims, bounded retry, dead-letter, and manual-repair states.
- Added append-only consent evidence, normalized suppression, signed one-click opt-out, regional policy and quiet-hour evaluation, hourly/daily rate limits, separate-human approval, send-time control rechecks, provider receipts, and real Resend delivery without simulated success.
- Added governed operator screens and authenticated APIs for leads, review, policies, connectors, sync repair, handoff, conversion, metrics, and account lifecycle. Unsupported legacy scaffold routes are denied at the request boundary; generated gap/AI behavior, runtime seeds, demo credentials, direct mass-email paths, in-memory mock operations, public registration, and unsafe assignment routes were removed.
- Replaced destructive startup with separate build, migration, one-time fail-closed provisioning, web, and worker commands. Added least-privilege container targets, Compose configuration with required credentials, liveness/readiness checks, session revocation, backup/confirmed-restore scripts, connector/runbook documentation, and CI covering migrations, tests, type/lint/build, dependency audit, image build, and full-history secret scanning.
- Validation evidence: all 24 migrations applied to a fresh PostgreSQL database and replayed as a no-op; a live migration-to-Prisma-schema comparison reported no drift across 176 tables; Prisma format/validate/generate passed; both append-only evidence triggers were present and mutation rejection was exercised; 6/6 real-database unit, authorization, end-to-end, idempotency, opt-out replay, and failure-path tests passed; scoped ESLint and full TypeScript checks passed; a clean copy containing no `.env` files produced a Next.js standalone production build with packaged public/static assets. The built server returned live/ready, served the login page and its static asset, redirected the protected UI, denied unauthenticated APIs with 401, rejected a cross-origin authenticated mutation with 403, and blocked unsupported legacy routes with 404. A custom-format backup and confirmed restore preserved identical migration/audit/consent counts (`24:38:4`); the vulnerable `uuid` and Prisma development-server transitive lines were overridden to patched versions, while a checked-in audit policy permits only the unfixed moderate PostCSS copy bundled by Next.js and rejects every other advisory; clean working-source and full Git-history Gitleaks scans found no secrets; `git diff --check`, shell syntax, executable startup mode, and `docker compose config` passed. CI generates authentication and opt-out secrets per run. A local image build was not run because no Docker daemon was available, while the checked-in CI image-build job supplies that proof on a Docker-enabled runner.

## Runtime verification (2026-07-20)

- The launcher now maps the shared caller-supplied session secret into NextAuth when `NEXTAUTH_SECRET` is not separately provided, derives `NEXTAUTH_URL` from the assigned loopback host/port, and exposes the existing fail-closed one-time provisioner under the conventional `create-admin` command.
- Disposable PostgreSQL startup, NextAuth credentials login/session, protected-route rejection, and a primary governed lead API are the acceptance boundary for this campaign.
