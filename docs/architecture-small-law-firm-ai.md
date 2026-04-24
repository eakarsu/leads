# Small Law Firm AI - Architecture Diagrams

## Table of Contents
1. [High-Level System Architecture](#1-high-level-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Database Schema](#3-database-schema)
4. [API Architecture](#4-api-architecture)
5. [AI Services Architecture](#5-ai-services-architecture)
6. [Authentication & Multi-Tenancy](#6-authentication--multi-tenancy)
7. [Client Intake Flow](#7-client-intake-flow)
8. [Document Management Architecture](#8-document-management-architecture)
9. [Time & Billing Architecture](#9-time--billing-architecture)
10. [Integration Architecture](#10-integration-architecture)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Security Architecture](#12-security-architecture)

---

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENT LAYER                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│   │   Web App    │    │  Mobile App  │    │Client Portal │    │ Booking Page │          │
│   │   (React)    │    │(React Native)│    │   (React)    │    │   (React)    │          │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘          │
│          │                   │                   │                   │                   │
└──────────┼───────────────────┼───────────────────┼───────────────────┼───────────────────┘
           │                   │                   │                   │
           └───────────────────┴───────────────────┴───────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    API GATEWAY                                           │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          AWS API Gateway / Kong                                  │   │
│   │   • Rate Limiting  • Authentication  • Request Routing  • SSL Termination       │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 APPLICATION LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         CORE API (Node.js / Next.js)                             │   │
│   │   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐         │   │
│   │   │  Clients  │ │  Matters  │ │ Documents │ │   Time    │ │  Billing  │         │   │
│   │   │  Service  │ │  Service  │ │  Service  │ │  Service  │ │  Service  │         │   │
│   │   └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘         │   │
│   │   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐         │   │
│   │   │ Calendar  │ │  Comms    │ │ Conflicts │ │ Deadlines │ │  Reports  │         │   │
│   │   │  Service  │ │  Service  │ │  Service  │ │  Service  │ │  Service  │         │   │
│   │   └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘         │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                               │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                           AI SERVICES LAYER                                      │   │
│   │   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │   │
│   │   │  Document  │ │   Legal    │ │  Contract  │ │    Time    │ │   Voice    │    │   │
│   │   │  Drafting  │ │  Research  │ │   Review   │ │   Capture  │ │   Agent    │    │   │
│   │   └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘    │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    DATA LAYER                                            │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│   │  PostgreSQL  │    │    Redis     │    │   AWS S3     │    │Elasticsearch │          │
│   │  (Primary)   │    │   (Cache)    │    │  (Documents) │    │  (Search)    │          │
│   └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘          │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               EXTERNAL INTEGRATIONS                                      │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │
│   │ Stripe │ │ Twilio │ │DocuSign│ │SendGrid│ │ OpenAI │ │ Google │ │Outlook │         │
│   │Payment │ │Voice/SM│ │E-Sign  │ │ Email  │ │Claude  │ │Calendar│ │  365   │         │
│   └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘         │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              TECHNOLOGY STACK OVERVIEW                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                                FRONTEND                                          │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │    │
│  │  │   Next.js   │ │    React    │ │  Tailwind   │ │   Shadcn    │               │    │
│  │  │     14      │ │     18      │ │     CSS     │ │     UI      │               │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘               │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │    │
│  │  │   TanStack  │ │    Zustand  │ │  React Hook │ │    Zod      │               │    │
│  │  │    Query    │ │   (State)   │ │    Form     │ │ (Validation)│               │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                                 BACKEND                                          │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │    │
│  │  │   Node.js   │ │   Next.js   │ │   Prisma    │ │    tRPC     │               │    │
│  │  │     20      │ │  API Routes │ │     ORM     │ │   (API)     │               │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘               │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │    │
│  │  │   BullMQ    │ │    Zod      │ │   NextAuth  │ │  Resend/    │               │    │
│  │  │   (Queue)   │ │ (Validate)  │ │   (Auth)    │ │  SendGrid   │               │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                                DATABASE                                          │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │    │
│  │  │ PostgreSQL  │ │    Redis    │ │   AWS S3    │ │   Pinecone  │               │    │
│  │  │   (Data)    │ │  (Cache/Q)  │ │   (Files)   │ │  (Vectors)  │               │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              AI / ML SERVICES                                    │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │    │
│  │  │   Claude    │ │   OpenAI    │ │  Deepgram   │ │  ElevenLabs │               │    │
│  │  │  (Primary)  │ │ (Embeddings)│ │   (STT)     │ │    (TTS)    │               │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              INFRASTRUCTURE                                      │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │    │
│  │  │   Vercel    │ │  AWS (S3,   │ │  Cloudflare │ │   Docker    │               │    │
│  │  │  (Hosting)  │ │  RDS, SES)  │ │   (CDN)     │ │ (Containers)│               │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA (PostgreSQL)                                │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              CORE TABLES                                         │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌──────────────────────┐          ┌──────────────────────┐                             │
│  │       tenants        │          │        users         │                             │
│  ├──────────────────────┤          ├──────────────────────┤                             │
│  │ id            UUID PK│◄─────────│ tenant_id     UUID FK│                             │
│  │ name          VARCHAR│          │ id            UUID PK│                             │
│  │ subdomain     VARCHAR│          │ email         VARCHAR│                             │
│  │ custom_domain VARCHAR│          │ password_hash VARCHAR│                             │
│  │ settings      JSONB  │          │ role          ENUM   │                             │
│  │ subscription  VARCHAR│          │ permissions   JSONB  │                             │
│  │ created_at    TIMESTAMP         │ created_at    TIMESTAMP                            │
│  │ updated_at    TIMESTAMP         │ last_login    TIMESTAMP                            │
│  └──────────────────────┘          └──────────────────────┘                             │
│           │                                   │                                          │
│           │                                   │                                          │
│           ▼                                   ▼                                          │
│  ┌──────────────────────┐          ┌──────────────────────┐                             │
│  │       clients        │          │       matters        │                             │
│  ├──────────────────────┤          ├──────────────────────┤                             │
│  │ id            UUID PK│◄─────────│ client_id     UUID FK│                             │
│  │ tenant_id     UUID FK│          │ id            UUID PK│                             │
│  │ type          ENUM   │          │ tenant_id     UUID FK│                             │
│  │ first_name    VARCHAR│          │ matter_number VARCHAR│                             │
│  │ last_name     VARCHAR│          │ name          VARCHAR│                             │
│  │ company_name  VARCHAR│          │ practice_area ENUM   │                             │
│  │ email         VARCHAR│          │ status        ENUM   │                             │
│  │ phone         VARCHAR│          │ billing_type  ENUM   │                             │
│  │ address       JSONB  │          │ open_date     DATE   │                             │
│  │ custom_fields JSONB  │          │ close_date    DATE   │                             │
│  │ tags          TEXT[] │          │ responsible_id UUID FK                             │
│  │ created_at    TIMESTAMP         │ created_at    TIMESTAMP                            │
│  └──────────────────────┘          └──────────────────────┘                             │
│           │                                   │                                          │
│           │                                   │                                          │
│  ┌────────┴───────────────────────────────────┴────────┐                                │
│  │                                                      │                                │
│  ▼                                                      ▼                                │
│  ┌──────────────────────┐          ┌──────────────────────┐                             │
│  │      documents       │          │     time_entries     │                             │
│  ├──────────────────────┤          ├──────────────────────┤                             │
│  │ id            UUID PK│          │ id            UUID PK│                             │
│  │ tenant_id     UUID FK│          │ tenant_id     UUID FK│                             │
│  │ matter_id     UUID FK│          │ matter_id     UUID FK│                             │
│  │ client_id     UUID FK│          │ user_id       UUID FK│                             │
│  │ name          VARCHAR│          │ date          DATE   │                             │
│  │ type          ENUM   │          │ duration      DECIMAL│                             │
│  │ category      ENUM   │          │ description   TEXT   │                             │
│  │ s3_key        VARCHAR│          │ activity_code VARCHAR│                             │
│  │ size_bytes    BIGINT │          │ rate          DECIMAL│                             │
│  │ mime_type     VARCHAR│          │ billable      BOOLEAN│                             │
│  │ version       INTEGER│          │ status        ENUM   │                             │
│  │ created_by    UUID FK│          │ created_at    TIMESTAMP                            │
│  │ created_at    TIMESTAMP         └──────────────────────┘                             │
│  └──────────────────────┘                                                                │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                           ADDITIONAL TABLES                                      │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌──────────────────────┐          ┌──────────────────────┐                             │
│  │      invoices        │          │      payments        │                             │
│  ├──────────────────────┤          ├──────────────────────┤                             │
│  │ id            UUID PK│◄─────────│ invoice_id    UUID FK│                             │
│  │ tenant_id     UUID FK│          │ id            UUID PK│                             │
│  │ client_id     UUID FK│          │ amount        DECIMAL│                             │
│  │ matter_id     UUID FK│          │ method        ENUM   │                             │
│  │ number        VARCHAR│          │ stripe_id     VARCHAR│                             │
│  │ amount        DECIMAL│          │ status        ENUM   │                             │
│  │ status        ENUM   │          │ created_at    TIMESTAMP                            │
│  │ due_date      DATE   │          └──────────────────────┘                             │
│  │ line_items    JSONB  │                                                                │
│  │ created_at    TIMESTAMP                                                               │
│  └──────────────────────┘                                                                │
│                                                                                          │
│  ┌──────────────────────┐          ┌──────────────────────┐                             │
│  │      deadlines       │          │   conflict_checks    │                             │
│  ├──────────────────────┤          ├──────────────────────┤                             │
│  │ id            UUID PK│          │ id            UUID PK│                             │
│  │ tenant_id     UUID FK│          │ tenant_id     UUID FK│                             │
│  │ matter_id     UUID FK│          │ client_id     UUID FK│                             │
│  │ title         VARCHAR│          │ matter_id     UUID FK│                             │
│  │ due_date      TIMESTAMP         │ search_terms  JSONB  │                             │
│  │ priority      ENUM   │          │ matches       JSONB  │                             │
│  │ status        ENUM   │          │ result        ENUM   │                             │
│  │ reminder_days INTEGER│          │ resolved_by   UUID FK│                             │
│  │ court_rule    VARCHAR│          │ created_at    TIMESTAMP                            │
│  │ created_at    TIMESTAMP         └──────────────────────┘                             │
│  └──────────────────────┘                                                                │
│                                                                                          │
│  ┌──────────────────────┐          ┌──────────────────────┐                             │
│  │    trust_accounts    │          │   trust_transactions │                             │
│  ├──────────────────────┤          ├──────────────────────┤                             │
│  │ id            UUID PK│◄─────────│ account_id    UUID FK│                             │
│  │ tenant_id     UUID FK│          │ id            UUID PK│                             │
│  │ name          VARCHAR│          │ client_id     UUID FK│                             │
│  │ bank_name     VARCHAR│          │ matter_id     UUID FK│                             │
│  │ account_number VARCHAR(enc)     │ type          ENUM   │                             │
│  │ routing       VARCHAR(enc)      │ amount        DECIMAL│                             │
│  │ balance       DECIMAL│          │ description   TEXT   │                             │
│  │ created_at    TIMESTAMP         │ created_at    TIMESTAMP                            │
│  └──────────────────────┘          └──────────────────────┘                             │
│                                                                                          │
│  ┌──────────────────────┐          ┌──────────────────────┐                             │
│  │    appointments      │          │   communications     │                             │
│  ├──────────────────────┤          ├──────────────────────┤                             │
│  │ id            UUID PK│          │ id            UUID PK│                             │
│  │ tenant_id     UUID FK│          │ tenant_id     UUID FK│                             │
│  │ client_id     UUID FK│          │ client_id     UUID FK│                             │
│  │ matter_id     UUID FK│          │ matter_id     UUID FK│                             │
│  │ user_id       UUID FK│          │ channel       ENUM   │                             │
│  │ title         VARCHAR│          │ direction     ENUM   │                             │
│  │ start_time    TIMESTAMP         │ subject       VARCHAR│                             │
│  │ end_time      TIMESTAMP         │ content       TEXT   │                             │
│  │ type          ENUM   │          │ status        ENUM   │                             │
│  │ status        ENUM   │          │ created_at    TIMESTAMP                            │
│  │ created_at    TIMESTAMP         └──────────────────────┘                             │
│  └──────────────────────┘                                                                │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ENTITY RELATIONSHIPS                                        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│                                    ┌──────────┐                                          │
│                          ┌─────────│  TENANT  │─────────┐                                │
│                          │         └────┬─────┘         │                                │
│                          │              │               │                                │
│              ┌───────────┼──────────────┼───────────────┼───────────┐                    │
│              ▼           ▼              ▼               ▼           ▼                    │
│        ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│        │  USERS   │ │ CLIENTS  │ │ MATTERS  │ │DOCUMENTS │ │ SETTINGS │                 │
│        └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────────┘                 │
│             │            │            │            │                                     │
│             │            │            │            │                                     │
│             │      ┌─────┴─────┐      │      ┌─────┴─────┐                               │
│             │      ▼           ▼      ▼      ▼           ▼                               │
│             │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                                │
│             └─│ TIME   │ │INVOICES│ │DEADLINE│ │CONFLICT│                                │
│               │ENTRIES │ │        │ │   S    │ │ CHECKS │                                │
│               └────┬───┘ └────┬───┘ └────────┘ └────────┘                                │
│                    │          │                                                          │
│                    │          ▼                                                          │
│                    │    ┌──────────┐                                                     │
│                    │    │ PAYMENTS │                                                     │
│                    │    └──────────┘                                                     │
│                    │                                                                     │
│                    ▼                                                                     │
│              ┌──────────┐                                                                │
│              │ BILLING  │                                                                │
│              │ REPORTS  │                                                                │
│              └──────────┘                                                                │
│                                                                                          │
│  Legend:                                                                                 │
│  ─────── = One-to-Many Relationship                                                     │
│  ─ ─ ─ ─ = Many-to-Many Relationship                                                    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. API Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 API ARCHITECTURE                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              API GATEWAY LAYER                                   │    │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐    │    │
│  │  │                    Request Flow                                          │    │    │
│  │  │                                                                          │    │    │
│  │  │   Client  ──►  Rate      ──►  Auth     ──►  Route    ──►  Handler       │    │    │
│  │  │   Request     Limiter       Middleware     Matching      Function       │    │    │
│  │  │                                                                          │    │    │
│  │  └─────────────────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              API ENDPOINTS                                       │    │
│  │                                                                                  │    │
│  │  /api/v1                                                                        │    │
│  │  ├── /auth                                                                      │    │
│  │  │   ├── POST   /login                    # User login                          │    │
│  │  │   ├── POST   /logout                   # User logout                         │    │
│  │  │   ├── POST   /refresh                  # Refresh token                       │    │
│  │  │   └── POST   /forgot-password          # Password reset                      │    │
│  │  │                                                                              │    │
│  │  ├── /clients                                                                   │    │
│  │  │   ├── GET    /                         # List clients                        │    │
│  │  │   ├── POST   /                         # Create client                       │    │
│  │  │   ├── GET    /:id                      # Get client                          │    │
│  │  │   ├── PUT    /:id                      # Update client                       │    │
│  │  │   ├── DELETE /:id                      # Archive client                      │    │
│  │  │   └── GET    /:id/matters              # Client's matters                    │    │
│  │  │                                                                              │    │
│  │  ├── /matters                                                                   │    │
│  │  │   ├── GET    /                         # List matters                        │    │
│  │  │   ├── POST   /                         # Create matter                       │    │
│  │  │   ├── GET    /:id                      # Get matter                          │    │
│  │  │   ├── PUT    /:id                      # Update matter                       │    │
│  │  │   ├── GET    /:id/documents            # Matter documents                    │    │
│  │  │   ├── GET    /:id/time-entries         # Matter time entries                 │    │
│  │  │   └── GET    /:id/deadlines            # Matter deadlines                    │    │
│  │  │                                                                              │    │
│  │  ├── /documents                                                                 │    │
│  │  │   ├── GET    /                         # List documents                      │    │
│  │  │   ├── POST   /upload                   # Upload document                     │    │
│  │  │   ├── GET    /:id                      # Get document                        │    │
│  │  │   ├── GET    /:id/download             # Download document                   │    │
│  │  │   ├── POST   /:id/version              # New version                         │    │
│  │  │   └── DELETE /:id                      # Delete document                     │    │
│  │  │                                                                              │    │
│  │  ├── /time-entries                                                              │    │
│  │  │   ├── GET    /                         # List time entries                   │    │
│  │  │   ├── POST   /                         # Create time entry                   │    │
│  │  │   ├── PUT    /:id                      # Update time entry                   │    │
│  │  │   ├── DELETE /:id                      # Delete time entry                   │    │
│  │  │   └── POST   /batch                    # Batch approve                       │    │
│  │  │                                                                              │    │
│  │  ├── /invoices                                                                  │    │
│  │  │   ├── GET    /                         # List invoices                       │    │
│  │  │   ├── POST   /                         # Create invoice                      │    │
│  │  │   ├── GET    /:id                      # Get invoice                         │    │
│  │  │   ├── PUT    /:id                      # Update invoice                      │    │
│  │  │   ├── POST   /:id/send                 # Send invoice                        │    │
│  │  │   └── POST   /:id/payment              # Record payment                      │    │
│  │  │                                                                              │    │
│  │  ├── /calendar                                                                  │    │
│  │  │   ├── GET    /events                   # List events                         │    │
│  │  │   ├── POST   /events                   # Create event                        │    │
│  │  │   ├── PUT    /events/:id               # Update event                        │    │
│  │  │   └── DELETE /events/:id               # Delete event                        │    │
│  │  │                                                                              │    │
│  │  ├── /deadlines                                                                 │    │
│  │  │   ├── GET    /                         # List deadlines                      │    │
│  │  │   ├── POST   /                         # Create deadline                     │    │
│  │  │   ├── PUT    /:id                      # Update deadline                     │    │
│  │  │   └── POST   /calculate                # Calculate from rules                │    │
│  │  │                                                                              │    │
│  │  ├── /conflicts                                                                 │    │
│  │  │   ├── POST   /check                    # Run conflict check                  │    │
│  │  │   └── GET    /history                  # Conflict check history              │    │
│  │  │                                                                              │    │
│  │  ├── /trust                                                                     │    │
│  │  │   ├── GET    /accounts                 # List trust accounts                 │    │
│  │  │   ├── GET    /ledger/:client_id        # Client ledger                       │    │
│  │  │   ├── POST   /transactions             # Record transaction                  │    │
│  │  │   └── GET    /reconciliation           # Reconciliation report               │    │
│  │  │                                                                              │    │
│  │  └── /ai                                                                        │    │
│  │      ├── POST   /document/draft           # AI document drafting                │    │
│  │      ├── POST   /research                 # AI legal research                   │    │
│  │      ├── POST   /contract/review          # AI contract review                  │    │
│  │      └── GET    /time-suggestions         # AI time entry suggestions           │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. AI Services Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              AI SERVICES ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              AI ORCHESTRATION LAYER                              │    │
│  │                                                                                  │    │
│  │   ┌──────────────────────────────────────────────────────────────────────────┐  │    │
│  │   │                         AI Request Router                                 │  │    │
│  │   │   • Request Classification  • Model Selection  • Cost Optimization       │  │    │
│  │   └──────────────────────────────────────────────────────────────────────────┘  │    │
│  │                                      │                                          │    │
│  │          ┌───────────────┬───────────┼───────────┬───────────────┐              │    │
│  │          ▼               ▼           ▼           ▼               ▼              │    │
│  │   ┌────────────┐  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │    │
│  │   │  Document  │  │   Legal    │ │  Contract  │ │    Time    │ │   Voice    │  │    │
│  │   │  Drafting  │  │  Research  │ │   Review   │ │   Capture  │ │   Agent    │  │    │
│  │   │  Service   │  │  Service   │ │  Service   │ │  Service   │ │  Service   │  │    │
│  │   └─────┬──────┘  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘  │    │
│  │         │               │             │             │               │          │    │
│  └─────────┼───────────────┼─────────────┼─────────────┼───────────────┼──────────┘    │
│            │               │             │             │               │               │
│            ▼               ▼             ▼             ▼               ▼               │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              AI PROVIDER LAYER                                   │    │
│  │                                                                                  │    │
│  │   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐               │    │
│  │   │   Claude   │  │   OpenAI   │  │  Deepgram  │  │ ElevenLabs │               │    │
│  │   │  (Sonnet)  │  │(Embeddings)│  │   (STT)    │  │   (TTS)    │               │    │
│  │   └────────────┘  └────────────┘  └────────────┘  └────────────┘               │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           AI DOCUMENT DRAFTING FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌─────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│   │  User   │───►│   Request    │───►│   Context    │───►│   Template   │              │
│   │ Request │    │  Validation  │    │  Retrieval   │    │  Selection   │              │
│   └─────────┘    └──────────────┘    └──────────────┘    └──────────────┘              │
│                                                                   │                      │
│                                                                   ▼                      │
│   ┌─────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│   │  Final  │◄───│   Quality    │◄───│     LLM      │◄───│   Prompt     │              │
│   │Document │    │    Check     │    │  Generation  │    │Construction  │              │
│   └─────────┘    └──────────────┘    └──────────────┘    └──────────────┘              │
│                                                                                          │
│   Context Retrieval:                                                                     │
│   ├── Matter details (parties, dates, jurisdiction)                                     │
│   ├── Client information                                                                │
│   ├── Related documents (precedents)                                                    │
│   ├── Firm templates                                                                    │
│   └── Jurisdiction-specific rules                                                       │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           AI LEGAL RESEARCH FLOW                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          Research Query Pipeline                                 │   │
│   │                                                                                  │   │
│   │   User      Query       Issue        Search      Result      Summary            │   │
│   │   Query  ─► Parser  ─► Extractor ─► Engine  ─► Ranker  ─► Generator            │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          Knowledge Sources                                       │   │
│   │                                                                                  │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │   │
│   │   │  Case Law    │  │   Statutes   │  │  Secondary   │  │    Firm      │        │   │
│   │   │  Database    │  │  & Codes     │  │   Sources    │  │  Precedents  │        │   │
│   │   │  (Vector DB) │  │  (Vector DB) │  │  (Vector DB) │  │  (Vector DB) │        │   │
│   │   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘        │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           AI CONTRACT REVIEW FLOW                                        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌─────────┐                                                                           │
│   │Contract │                                                                           │
│   │ Upload  │                                                                           │
│   └────┬────┘                                                                           │
│        │                                                                                │
│        ▼                                                                                │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          Document Processing                                     │   │
│   │   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐               │   │
│   │   │    OCR     │  │   Parse    │  │   Section  │  │   Party    │               │   │
│   │   │ (if scan)  │─►│  Document  │─►│  Detection │─►│ Extraction │               │   │
│   │   └────────────┘  └────────────┘  └────────────┘  └────────────┘               │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                            │                                            │
│                                            ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          AI Analysis Engine                                      │   │
│   │   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐               │   │
│   │   │   Risk     │  │  Missing   │  │  Compare   │  │  Generate  │               │   │
│   │   │ Detection  │  │  Clauses   │  │ to Playbook│  │  Summary   │               │   │
│   │   └────────────┘  └────────────┘  └────────────┘  └────────────┘               │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                            │                                            │
│                                            ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          Output Report                                           │   │
│   │   • Executive Summary           • Risk Score (1-10)                             │   │
│   │   • Key Terms Extracted         • Clause-by-Clause Analysis                     │   │
│   │   • Missing Provisions          • Suggested Revisions                           │   │
│   │   • Negotiation Points          • Comparison to Template                        │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           AI VOICE AGENT ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                              Call Flow                                           │   │
│   │                                                                                  │   │
│   │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                  │   │
│   │   │  Twilio  │───►│ Deepgram │───►│  Claude  │───►│ElevenLabs│───► Caller       │   │
│   │   │  (Call)  │    │  (STT)   │    │  (LLM)   │    │  (TTS)   │                  │   │
│   │   └──────────┘    └──────────┘    └──────────┘    └──────────┘                  │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          Intent Handling                                         │   │
│   │                                                                                  │   │
│   │   Detected Intent              Action                                            │   │
│   │   ─────────────────────────────────────────────────────────────────             │   │
│   │   Schedule Consultation   ───► Check calendar, book appointment                 │   │
│   │   Case Status Inquiry     ───► Look up matter, provide update                   │   │
│   │   Billing Question        ───► Check balance, payment info                      │   │
│   │   Speak to Attorney       ───► Transfer to extension                            │   │
│   │   New Case Inquiry        ───► Collect info, create intake                      │   │
│   │   Emergency               ───► Immediate transfer + alert                       │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Authentication & Multi-Tenancy

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          AUTHENTICATION & MULTI-TENANCY                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              AUTH FLOW                                           │    │
│  │                                                                                  │    │
│  │   ┌────────────┐                                                                │    │
│  │   │   Login    │                                                                │    │
│  │   │   Request  │                                                                │    │
│  │   └─────┬──────┘                                                                │    │
│  │         │                                                                        │    │
│  │         ▼                                                                        │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                    Subdomain/Domain Resolution                          │    │    │
│  │   │                                                                          │    │    │
│  │   │   acmelaw.legalai.com  ──────►  Tenant: acme-law-firm                   │    │    │
│  │   │   app.acmelaw.com      ──────►  Tenant: acme-law-firm (custom domain)   │    │    │
│  │   │                                                                          │    │    │
│  │   └─────────────────────────────────────────────────────────────────────────┘    │    │
│  │         │                                                                        │    │
│  │         ▼                                                                        │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                    Credential Verification                              │    │    │
│  │   │                                                                          │    │    │
│  │   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │    │    │
│  │   │   │Email/Pass   │    │ Google SSO  │    │   SAML      │                │    │    │
│  │   │   │   Auth      │    │             │    │   (Okta)    │                │    │    │
│  │   │   └─────────────┘    └─────────────┘    └─────────────┘                │    │    │
│  │   │                                                                          │    │    │
│  │   └─────────────────────────────────────────────────────────────────────────┘    │    │
│  │         │                                                                        │    │
│  │         ▼                                                                        │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                    Token Generation                                      │    │    │
│  │   │                                                                          │    │    │
│  │   │   JWT Payload:                                                           │    │    │
│  │   │   {                                                                      │    │    │
│  │   │     "sub": "user-uuid",                                                  │    │    │
│  │   │     "tenant_id": "tenant-uuid",                                          │    │    │
│  │   │     "role": "attorney",                                                  │    │    │
│  │   │     "permissions": ["matters.read", "matters.write", ...],               │    │    │
│  │   │     "exp": 1234567890                                                    │    │    │
│  │   │   }                                                                      │    │    │
│  │   │                                                                          │    │    │
│  │   └─────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                           TENANT ISOLATION                                       │    │
│  │                                                                                  │    │
│  │   Database Level:                                                               │    │
│  │   ┌─────────────────────────────────────────────────────────────────────────┐   │    │
│  │   │   Option A: Row-Level Security (RLS)                                     │   │    │
│  │   │                                                                          │   │    │
│  │   │   CREATE POLICY tenant_isolation ON clients                              │   │    │
│  │   │     USING (tenant_id = current_setting('app.tenant_id')::uuid);          │   │    │
│  │   │                                                                          │   │    │
│  │   └─────────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                                  │    │
│  │   ┌─────────────────────────────────────────────────────────────────────────┐   │    │
│  │   │   Option B: Schema-per-Tenant (Enterprise)                               │   │    │
│  │   │                                                                          │   │    │
│  │   │   tenant_acme.clients                                                    │   │    │
│  │   │   tenant_acme.matters                                                    │   │    │
│  │   │   tenant_smith.clients                                                   │   │    │
│  │   │   tenant_smith.matters                                                   │   │    │
│  │   │                                                                          │   │    │
│  │   └─────────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                                  │    │
│  │   File Storage:                                                                 │    │
│  │   ┌─────────────────────────────────────────────────────────────────────────┐   │    │
│  │   │   S3 Bucket Structure:                                                   │   │    │
│  │   │                                                                          │   │    │
│  │   │   s3://legal-ai-documents/                                               │   │    │
│  │   │   ├── tenant-acme-uuid/                                                  │   │    │
│  │   │   │   ├── matters/                                                       │   │    │
│  │   │   │   ├── clients/                                                       │   │    │
│  │   │   │   └── templates/                                                     │   │    │
│  │   │   └── tenant-smith-uuid/                                                 │   │    │
│  │   │       ├── matters/                                                       │   │    │
│  │   │       └── ...                                                            │   │    │
│  │   │                                                                          │   │    │
│  │   └─────────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                           ROLE-BASED ACCESS CONTROL                              │    │
│  │                                                                                  │    │
│  │   ┌──────────────────────────────────────────────────────────────────────────┐  │    │
│  │   │  Role           Permissions                                               │  │    │
│  │   │  ─────────────────────────────────────────────────────────────────────── │  │    │
│  │   │  Owner          Full access, billing, user management                    │  │    │
│  │   │  Admin          User management, settings, all data                      │  │    │
│  │   │  Attorney       Matters, clients, billing, documents                     │  │    │
│  │   │  Paralegal      Matters (assigned), documents, time entries              │  │    │
│  │   │  Secretary      Calendar, clients (read), documents                      │  │    │
│  │   │  Bookkeeper     Billing, trust accounts, payments                        │  │    │
│  │   │  Viewer         Read-only access to assigned matters                     │  │    │
│  │   └──────────────────────────────────────────────────────────────────────────┘  │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Client Intake Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT INTAKE FLOW                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌────────────────────────────────────────────────────────────────────────────────┐    │
│   │                         PUBLIC INTAKE FORM                                      │    │
│   │                                                                                 │    │
│   │   ┌─────────────┐                                                              │    │
│   │   │  Potential  │                                                              │    │
│   │   │   Client    │                                                              │    │
│   │   └──────┬──────┘                                                              │    │
│   │          │                                                                      │    │
│   │          ▼                                                                      │    │
│   │   ┌──────────────────────────────────────────────────────────────────────┐     │    │
│   │   │                    Intake Form (Embedded Widget)                      │     │    │
│   │   │                                                                        │     │    │
│   │   │   • Personal Information                                               │     │    │
│   │   │   • Contact Details                                                    │     │    │
│   │   │   • Practice Area Selection                                            │     │    │
│   │   │   • Case Description                                                   │     │    │
│   │   │   • Document Upload (ID, existing docs)                                │     │    │
│   │   │   • Preferred Contact Method                                           │     │    │
│   │   │   • Referral Source                                                    │     │    │
│   │   │                                                                        │     │    │
│   │   └───────────────────────────────┬──────────────────────────────────────┘     │    │
│   │                                   │                                            │    │
│   └───────────────────────────────────┼────────────────────────────────────────────┘    │
│                                       │                                                  │
│                                       ▼                                                  │
│   ┌────────────────────────────────────────────────────────────────────────────────┐    │
│   │                         AI PROCESSING                                           │    │
│   │                                                                                 │    │
│   │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                     │    │
│   │   │   Extract    │    │   Classify   │    │   Assess     │                     │    │
│   │   │     Key      │───►│   Practice   │───►│   Urgency    │                     │    │
│   │   │ Information  │    │     Area     │    │    Level     │                     │    │
│   │   └──────────────┘    └──────────────┘    └──────────────┘                     │    │
│   │          │                                       │                              │    │
│   │          ▼                                       ▼                              │    │
│   │   ┌──────────────┐                        ┌──────────────┐                     │    │
│   │   │   Suggest    │                        │   Generate   │                     │    │
│   │   │ Matter Type  │                        │Initial Notes │                     │    │
│   │   └──────────────┘                        └──────────────┘                     │    │
│   │                                                                                 │    │
│   └─────────────────────────────────────┬───────────────────────────────────────────┘    │
│                                         │                                                │
│                                         ▼                                                │
│   ┌────────────────────────────────────────────────────────────────────────────────┐    │
│   │                         CONFLICT CHECK                                          │    │
│   │                                                                                 │    │
│   │   ┌──────────────────────────────────────────────────────────────────────┐     │    │
│   │   │                    Automatic Conflict Search                          │     │    │
│   │   │                                                                        │     │    │
│   │   │   Search Terms:                                                        │     │    │
│   │   │   • Potential client name (exact + phonetic)                           │     │    │
│   │   │   • Adverse parties mentioned                                          │     │    │
│   │   │   • Company names                                                      │     │    │
│   │   │   • Related parties                                                    │     │    │
│   │   │                                                                        │     │    │
│   │   │   Results:                                                             │     │    │
│   │   │   ┌────────┐  ┌────────────────┐  ┌──────────────────┐                │     │    │
│   │   │   │ Clear  │  │   Potential    │  │    Conflict      │                │     │    │
│   │   │   │        │  │   Conflict     │  │   Identified     │                │     │    │
│   │   │   │   ▼    │  │       ▼        │  │        ▼         │                │     │    │
│   │   │   │Continue│  │ Flag for Review│  │ Decline/Waiver   │                │     │    │
│   │   │   └────────┘  └────────────────┘  └──────────────────┘                │     │    │
│   │   │                                                                        │     │    │
│   │   └──────────────────────────────────────────────────────────────────────┘     │    │
│   │                                                                                 │    │
│   └─────────────────────────────────────┬───────────────────────────────────────────┘    │
│                                         │                                                │
│                                         ▼                                                │
│   ┌────────────────────────────────────────────────────────────────────────────────┐    │
│   │                         REVIEW QUEUE                                            │    │
│   │                                                                                 │    │
│   │   ┌──────────────────────────────────────────────────────────────────────┐     │    │
│   │   │                    Intake Dashboard                                   │     │    │
│   │   │                                                                        │     │    │
│   │   │   New Intakes (5)                                                     │     │    │
│   │   │   ┌────────────────────────────────────────────────────────────────┐  │     │    │
│   │   │   │ ● John Smith    │ Personal Injury │ High Urgency │ 2 hrs ago   │  │     │    │
│   │   │   │ ○ ABC Corp      │ Corporate       │ Medium       │ 5 hrs ago   │  │     │    │
│   │   │   │ ○ Mary Johnson  │ Family Law      │ Normal       │ 1 day ago   │  │     │    │
│   │   │   └────────────────────────────────────────────────────────────────┘  │     │    │
│   │   │                                                                        │     │    │
│   │   │   Actions:                                                            │     │    │
│   │   │   [Accept] [Decline] [Assign] [Schedule Consultation]                 │     │    │
│   │   │                                                                        │     │    │
│   │   └──────────────────────────────────────────────────────────────────────┘     │    │
│   │                                                                                 │    │
│   └─────────────────────────────────────┬───────────────────────────────────────────┘    │
│                                         │                                                │
│                                         ▼                                                │
│   ┌────────────────────────────────────────────────────────────────────────────────┐    │
│   │                         CONVERSION TO CLIENT                                    │    │
│   │                                                                                 │    │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │    │
│   │   │   Create    │  │   Create    │  │  Generate   │  │   Send      │          │    │
│   │   │   Client    │─►│   Matter    │─►│ Engagement  │─►│  Welcome    │          │    │
│   │   │   Record    │  │   Record    │  │   Letter    │  │   Email     │          │    │
│   │   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘          │    │
│   │                                                                                 │    │
│   └────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Document Management Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          DOCUMENT MANAGEMENT ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          UPLOAD FLOW                                             │   │
│   │                                                                                  │   │
│   │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │   │
│   │   │  Client  │───►│   API    │───►│  Virus   │───►│   S3     │───►│  Index   │ │   │
│   │   │  Upload  │    │ Endpoint │    │   Scan   │    │  Storage │    │  Update  │ │   │
│   │   └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘ │   │
│   │                                                                                  │   │
│   │   Additional Processing:                                                        │   │
│   │   ┌──────────┐    ┌──────────┐    ┌──────────┐                                 │   │
│   │   │   OCR    │    │ Thumbnail│    │ Extract  │                                 │   │
│   │   │(if image)│    │Generation│    │ Metadata │                                 │   │
│   │   └──────────┘    └──────────┘    └──────────┘                                 │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          STORAGE ARCHITECTURE                                    │   │
│   │                                                                                  │   │
│   │   ┌────────────────────────────────────────────────────────────────────────┐    │   │
│   │   │                         AWS S3                                          │    │   │
│   │   │                                                                          │    │   │
│   │   │   legal-ai-documents/                                                   │    │   │
│   │   │   ├── {tenant_id}/                                                      │    │   │
│   │   │   │   ├── matters/                                                      │    │   │
│   │   │   │   │   ├── {matter_id}/                                              │    │   │
│   │   │   │   │   │   ├── pleadings/                                            │    │   │
│   │   │   │   │   │   ├── discovery/                                            │    │   │
│   │   │   │   │   │   ├── correspondence/                                       │    │   │
│   │   │   │   │   │   └── exhibits/                                             │    │   │
│   │   │   │   ├── clients/                                                      │    │   │
│   │   │   │   │   └── {client_id}/                                              │    │   │
│   │   │   │   └── templates/                                                    │    │   │
│   │   │   │                                                                      │    │   │
│   │   │   Storage Classes:                                                      │    │   │
│   │   │   • Recent (< 30 days): S3 Standard                                     │    │   │
│   │   │   • Archived (> 1 year): S3 Glacier                                     │    │   │
│   │   │   • Closed matters (> 7 years): S3 Glacier Deep Archive                 │    │   │
│   │   │                                                                          │    │   │
│   │   └────────────────────────────────────────────────────────────────────────┘    │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          VERSION CONTROL                                         │   │
│   │                                                                                  │   │
│   │   Document: contract-v3.docx                                                    │   │
│   │   ┌────────────────────────────────────────────────────────────────────────┐    │   │
│   │   │   Version │ Date       │ User        │ Size   │ Notes                  │    │   │
│   │   │   ────────────────────────────────────────────────────────────────────│    │   │
│   │   │   v1      │ 2024-01-01 │ John Doe    │ 45KB   │ Initial draft          │    │   │
│   │   │   v2      │ 2024-01-05 │ Jane Smith  │ 48KB   │ Added indemnification  │    │   │
│   │   │   v3      │ 2024-01-10 │ John Doe    │ 52KB   │ Client revisions       │    │   │
│   │   └────────────────────────────────────────────────────────────────────────┘    │   │
│   │                                                                                  │   │
│   │   Each version stored separately in S3:                                         │   │
│   │   s3://bucket/tenant/matter/doc-uuid/v1/contract.docx                           │   │
│   │   s3://bucket/tenant/matter/doc-uuid/v2/contract.docx                           │   │
│   │   s3://bucket/tenant/matter/doc-uuid/v3/contract.docx                           │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          SEARCH & RETRIEVAL                                      │   │
│   │                                                                                  │   │
│   │   ┌─────────────────────────────────────────────────────────────────────────┐   │   │
│   │   │                    Elasticsearch Index                                   │   │   │
│   │   │                                                                          │   │   │
│   │   │   Document Index Schema:                                                │   │   │
│   │   │   {                                                                      │   │   │
│   │   │     "id": "doc-uuid",                                                   │   │   │
│   │   │     "tenant_id": "tenant-uuid",                                         │   │   │
│   │   │     "matter_id": "matter-uuid",                                         │   │   │
│   │   │     "name": "Contract Agreement",                                       │   │   │
│   │   │     "type": "contract",                                                 │   │   │
│   │   │     "content": "Full text content from OCR...",                         │   │   │
│   │   │     "metadata": { ... },                                                │   │   │
│   │   │     "created_at": "2024-01-01T00:00:00Z"                                │   │   │
│   │   │   }                                                                      │   │   │
│   │   │                                                                          │   │   │
│   │   │   Search Features:                                                      │   │   │
│   │   │   • Full-text search across content                                     │   │   │
│   │   │   • Filter by matter, client, type                                      │   │   │
│   │   │   • Date range filtering                                                │   │   │
│   │   │   • Faceted search                                                      │   │   │
│   │   │                                                                          │   │   │
│   │   └─────────────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Time & Billing Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          TIME & BILLING ARCHITECTURE                                     │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          TIME ENTRY FLOW                                         │   │
│   │                                                                                  │   │
│   │   ┌────────────────────────────────────────────────────────────────────────┐    │   │
│   │   │                    Entry Sources                                        │    │   │
│   │   │                                                                          │    │   │
│   │   │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │    │   │
│   │   │   │  Manual  │  │  Timer   │  │  Mobile  │  │    AI    │               │    │   │
│   │   │   │  Entry   │  │          │  │   App    │  │ Captured │               │    │   │
│   │   │   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘               │    │   │
│   │   │        │             │             │             │                      │    │   │
│   │   │        └─────────────┴─────────────┴─────────────┘                      │    │   │
│   │   │                              │                                          │    │   │
│   │   │                              ▼                                          │    │   │
│   │   │                    ┌──────────────────┐                                 │    │   │
│   │   │                    │   Time Entry     │                                 │    │   │
│   │   │                    │   Validation     │                                 │    │   │
│   │   │                    └────────┬─────────┘                                 │    │   │
│   │   │                             │                                           │    │   │
│   │   └─────────────────────────────┼───────────────────────────────────────────┘    │   │
│   │                                 ▼                                                │   │
│   │   ┌─────────────────────────────────────────────────────────────────────────┐   │   │
│   │   │                    AI Time Capture                                       │   │   │
│   │   │                                                                          │   │   │
│   │   │   Data Sources:                                                         │   │   │
│   │   │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │   │   │
│   │   │   │  Email   │  │ Calendar │  │ Document │  │  Phone   │               │   │   │
│   │   │   │ Activity │  │  Events  │  │  Edits   │  │  Calls   │               │   │   │
│   │   │   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘               │   │   │
│   │   │        │             │             │             │                      │   │   │
│   │   │        └─────────────┴─────────────┴─────────────┘                      │   │   │
│   │   │                              │                                          │   │   │
│   │   │                              ▼                                          │   │   │
│   │   │                    ┌──────────────────┐                                 │   │   │
│   │   │                    │   AI Processing  │                                 │   │   │
│   │   │                    │                  │                                 │   │   │
│   │   │                    │ • Matter Match   │                                 │   │   │
│   │   │                    │ • Activity Code  │                                 │   │   │
│   │   │                    │ • Description    │                                 │   │   │
│   │   │                    │ • Duration Calc  │                                 │   │   │
│   │   │                    └────────┬─────────┘                                 │   │   │
│   │   │                             │                                           │   │   │
│   │   │                             ▼                                           │   │   │
│   │   │                    ┌──────────────────┐                                 │   │   │
│   │   │                    │ Draft Entries    │                                 │   │   │
│   │   │                    │     Queue        │                                 │   │   │
│   │   │                    └──────────────────┘                                 │   │   │
│   │   │                                                                          │   │   │
│   │   └─────────────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          BILLING PIPELINE                                        │   │
│   │                                                                                  │   │
│   │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │   │
│   │   │  Time    │───►│ Review & │───►│ Invoice  │───►│  Client  │───►│ Payment  │ │   │
│   │   │ Entries  │    │ Approve  │    │ Generate │    │  Review  │    │Collection│ │   │
│   │   └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘ │   │
│   │                                                                                  │   │
│   │   Invoice Generation:                                                           │   │
│   │   ┌─────────────────────────────────────────────────────────────────────────┐   │   │
│   │   │                                                                          │   │   │
│   │   │   1. Select matter(s) and date range                                    │   │   │
│   │   │   2. Pull approved time entries                                         │   │   │
│   │   │   3. Apply billing rates (by timekeeper)                                │   │   │
│   │   │   4. Add expenses                                                       │   │   │
│   │   │   5. Apply trust credits                                                │   │   │
│   │   │   6. Calculate taxes                                                    │   │   │
│   │   │   7. Generate PDF + LEDES file                                          │   │   │
│   │   │   8. Send to client (email/portal)                                      │   │   │
│   │   │                                                                          │   │   │
│   │   └─────────────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          TRUST ACCOUNTING FLOW                                   │   │
│   │                                                                                  │   │
│   │   ┌────────────────────────────────────────────────────────────────────────┐    │   │
│   │   │                                                                          │    │   │
│   │   │   IOLTA Account                                                         │    │   │
│   │   │   ┌─────────────────────────────────────────────────────────────────┐   │    │   │
│   │   │   │                                                                  │   │    │   │
│   │   │   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │   │    │   │
│   │   │   │   │   Client    │    │   Client    │    │   Client    │        │   │    │   │
│   │   │   │   │  A Ledger   │    │  B Ledger   │    │  C Ledger   │        │   │    │   │
│   │   │   │   │  $5,000     │    │  $12,500    │    │  $2,000     │        │   │    │   │
│   │   │   │   └─────────────┘    └─────────────┘    └─────────────┘        │   │    │   │
│   │   │   │                                                                  │   │    │   │
│   │   │   │   Bank Balance: $19,500                                         │   │    │   │
│   │   │   │   Client Total: $19,500                                         │   │    │   │
│   │   │   │   Difference: $0.00 ✓                                           │   │    │   │
│   │   │   │                                                                  │   │    │   │
│   │   │   └─────────────────────────────────────────────────────────────────┘   │    │   │
│   │   │                                                                          │    │   │
│   │   │   Three-Way Reconciliation:                                             │    │   │
│   │   │   1. Bank Statement Balance                                             │    │   │
│   │   │   2. Book Balance (software)                                            │    │   │
│   │   │   3. Sum of Client Ledgers                                              │    │   │
│   │   │   All three must match!                                                 │    │   │
│   │   │                                                                          │    │   │
│   │   └────────────────────────────────────────────────────────────────────────┘    │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          INTEGRATION ARCHITECTURE                                        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          INTEGRATION HUB                                         │   │
│   │                                                                                  │   │
│   │                        ┌──────────────────┐                                     │   │
│   │                        │   Integration    │                                     │   │
│   │                        │     Engine       │                                     │   │
│   │                        └────────┬─────────┘                                     │   │
│   │                                 │                                                │   │
│   │    ┌────────────────────────────┼────────────────────────────┐                  │   │
│   │    │                            │                            │                  │   │
│   │    ▼                            ▼                            ▼                  │   │
│   │ ┌──────────────┐         ┌──────────────┐         ┌──────────────┐             │   │
│   │ │   Payment    │         │Communication │         │  Calendar    │             │   │
│   │ │ Integrations │         │ Integrations │         │ Integrations │             │   │
│   │ └──────┬───────┘         └──────┬───────┘         └──────┬───────┘             │   │
│   │        │                        │                        │                      │   │
│   │   ┌────┴────┐             ┌─────┴─────┐            ┌────┴────┐                 │   │
│   │   ▼         ▼             ▼     ▼     ▼            ▼         ▼                 │   │
│   │ ┌─────┐ ┌─────┐      ┌─────┐ ┌─────┐ ┌─────┐  ┌─────┐ ┌─────────┐             │   │
│   │ │Stripe│ │Square│     │Twilio│ │Send │ │Gmail│  │Google│ │Outlook │             │   │
│   │ │     │ │     │      │     │ │Grid │ │ API │  │ Cal │ │   365  │             │   │
│   │ └─────┘ └─────┘      └─────┘ └─────┘ └─────┘  └─────┘ └─────────┘             │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          PAYMENT FLOW (STRIPE)                                   │   │
│   │                                                                                  │   │
│   │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                 │   │
│   │   │  Client  │───►│  Payment │───►│  Stripe  │───►│  Webhook │                 │   │
│   │   │  Clicks  │    │   Form   │    │   API    │    │ Callback │                 │   │
│   │   │  "Pay"   │    │(Elements)│    │          │    │          │                 │   │
│   │   └──────────┘    └──────────┘    └──────────┘    └────┬─────┘                 │   │
│   │                                                         │                       │   │
│   │                                                         ▼                       │   │
│   │                                                  ┌──────────────┐               │   │
│   │                                                  │Update Invoice│               │   │
│   │                                                  │ Status: Paid │               │   │
│   │                                                  └──────────────┘               │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          EMAIL INTEGRATION                                       │   │
│   │                                                                                  │   │
│   │   Outbound (SendGrid):                                                          │   │
│   │   ┌──────────┐    ┌──────────┐    ┌──────────┐                                 │   │
│   │   │  System  │───►│ SendGrid │───►│  Client  │                                 │   │
│   │   │  Event   │    │   API    │    │  Inbox   │                                 │   │
│   │   └──────────┘    └──────────┘    └──────────┘                                 │   │
│   │                                                                                  │   │
│   │   Inbound (Gmail/Outlook Sync):                                                 │   │
│   │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                 │   │
│   │   │  Email   │───►│  OAuth   │───►│  Sync    │───►│  Match   │                 │   │
│   │   │ Provider │    │  Token   │    │  Engine  │    │to Contact│                 │   │
│   │   └──────────┘    └──────────┘    └──────────┘    └──────────┘                 │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          CALENDAR SYNC                                           │   │
│   │                                                                                  │   │
│   │   Bi-directional Sync:                                                          │   │
│   │                                                                                  │   │
│   │   ┌────────────────┐                      ┌────────────────┐                    │   │
│   │   │   Legal AI     │ ◄──── Sync ────►    │ Google/Outlook │                    │   │
│   │   │   Calendar     │                      │    Calendar    │                    │   │
│   │   └────────────────┘                      └────────────────┘                    │   │
│   │                                                                                  │   │
│   │   Sync Logic:                                                                   │   │
│   │   • Create in Legal AI → Push to Google/Outlook                                 │   │
│   │   • Create in Google/Outlook → Pull to Legal AI                                 │   │
│   │   • Update either → Sync both                                                   │   │
│   │   • Delete either → Sync deletion                                               │   │
│   │   • Conflict resolution: Legal AI is source of truth                            │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          WEBHOOK ARCHITECTURE                                    │   │
│   │                                                                                  │   │
│   │   Outgoing Webhooks:                                                            │   │
│   │   ┌─────────────────────────────────────────────────────────────────────────┐   │   │
│   │   │   Event                        Payload                                   │   │   │
│   │   │   ─────────────────────────────────────────────────────────────────────│   │   │
│   │   │   client.created          { client_id, name, email, ... }              │   │   │
│   │   │   matter.status_changed   { matter_id, old_status, new_status }        │   │   │
│   │   │   document.uploaded       { document_id, matter_id, name }             │   │   │
│   │   │   invoice.paid            { invoice_id, amount, payment_method }       │   │   │
│   │   │   deadline.approaching    { deadline_id, matter_id, days_until }       │   │   │
│   │   └─────────────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                                  │   │
│   │   Incoming Webhooks:                                                            │   │
│   │   • Stripe payment events                                                       │   │
│   │   • Twilio call/SMS events                                                      │   │
│   │   • DocuSign signature events                                                   │   │
│   │   • Calendar sync events                                                        │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          DEPLOYMENT ARCHITECTURE                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          PRODUCTION ENVIRONMENT                                  │   │
│   │                                                                                  │   │
│   │   ┌────────────────────────────────────────────────────────────────────────┐    │   │
│   │   │                         Cloudflare                                      │    │   │
│   │   │   • CDN                  • DDoS Protection                             │    │   │
│   │   │   • SSL Termination      • WAF                                         │    │   │
│   │   └────────────────────────────────────┬───────────────────────────────────┘    │   │
│   │                                        │                                         │   │
│   │                                        ▼                                         │   │
│   │   ┌────────────────────────────────────────────────────────────────────────┐    │   │
│   │   │                         Vercel Edge                                     │    │   │
│   │   │   • Next.js App          • Serverless Functions                        │    │   │
│   │   │   • Edge Functions       • Image Optimization                          │    │   │
│   │   └────────────────────────────────────┬───────────────────────────────────┘    │   │
│   │                                        │                                         │   │
│   │            ┌───────────────────────────┼───────────────────────────┐            │   │
│   │            │                           │                           │            │   │
│   │            ▼                           ▼                           ▼            │   │
│   │   ┌──────────────┐          ┌──────────────┐          ┌──────────────┐         │   │
│   │   │    AWS       │          │    AWS       │          │    AWS       │         │   │
│   │   │    RDS       │          │     S3       │          │ElastiCache   │         │   │
│   │   │ (PostgreSQL) │          │ (Documents)  │          │  (Redis)     │         │   │
│   │   └──────────────┘          └──────────────┘          └──────────────┘         │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          CI/CD PIPELINE                                          │   │
│   │                                                                                  │   │
│   │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │   │
│   │   │   Push   │───►│  GitHub  │───►│   Build  │───►│   Test   │───►│  Deploy  │ │   │
│   │   │ to Main  │    │ Actions  │    │   (npm)  │    │  (Jest)  │    │ (Vercel) │ │   │
│   │   └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘ │   │
│   │                                                                                  │   │
│   │   Branch Strategy:                                                              │   │
│   │   • main → Production (auto-deploy)                                             │   │
│   │   • staging → Staging environment                                               │   │
│   │   • feature/* → Preview deployments                                             │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          SCALING STRATEGY                                        │   │
│   │                                                                                  │   │
│   │   ┌────────────────────────────────────────────────────────────────────────┐    │   │
│   │   │                                                                          │    │   │
│   │   │   Component          Scaling Strategy                                   │    │   │
│   │   │   ─────────────────────────────────────────────────────────────────────│    │   │
│   │   │   Web/API            Vercel auto-scaling (serverless)                  │    │   │
│   │   │   Database           RDS read replicas + connection pooling            │    │   │
│   │   │   Cache              Redis cluster mode                                │    │   │
│   │   │   File Storage       S3 (unlimited)                                    │    │   │
│   │   │   Search             OpenSearch Service (managed)                      │    │   │
│   │   │   Background Jobs    AWS Lambda + SQS                                  │    │   │
│   │   │                                                                          │    │   │
│   │   └────────────────────────────────────────────────────────────────────────┘    │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          MONITORING & OBSERVABILITY                              │   │
│   │                                                                                  │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │   │
│   │   │   Vercel     │  │   Sentry     │  │  Datadog /   │  │  PagerDuty   │        │   │
│   │   │  Analytics   │  │   (Errors)   │  │  New Relic   │  │   (Alerts)   │        │   │
│   │   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘        │   │
│   │                                                                                  │   │
│   │   Key Metrics:                                                                  │   │
│   │   • Response time (p50, p95, p99)                                               │   │
│   │   • Error rate                                                                  │   │
│   │   • Database query time                                                         │   │
│   │   • Active users                                                                │   │
│   │   • API endpoint usage                                                          │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY ARCHITECTURE                                           │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          SECURITY LAYERS                                         │   │
│   │                                                                                  │   │
│   │   ┌──────────────────────────────────────────────────────────────────────────┐  │   │
│   │   │  Layer 1: Network Security                                                │  │   │
│   │   │  • Cloudflare WAF (Web Application Firewall)                              │  │   │
│   │   │  • DDoS protection                                                        │  │   │
│   │   │  • Rate limiting                                                          │  │   │
│   │   │  • IP allowlisting (for admin)                                            │  │   │
│   │   └──────────────────────────────────────────────────────────────────────────┘  │   │
│   │                                        │                                         │   │
│   │                                        ▼                                         │   │
│   │   ┌──────────────────────────────────────────────────────────────────────────┐  │   │
│   │   │  Layer 2: Transport Security                                              │  │   │
│   │   │  • TLS 1.3 everywhere                                                     │  │   │
│   │   │  • HSTS (HTTP Strict Transport Security)                                  │  │   │
│   │   │  • Certificate pinning (mobile apps)                                      │  │   │
│   │   └──────────────────────────────────────────────────────────────────────────┘  │   │
│   │                                        │                                         │   │
│   │                                        ▼                                         │   │
│   │   ┌──────────────────────────────────────────────────────────────────────────┐  │   │
│   │   │  Layer 3: Application Security                                            │  │   │
│   │   │  • JWT authentication with short expiry                                   │  │   │
│   │   │  • RBAC (Role-Based Access Control)                                       │  │   │
│   │   │  • Input validation (Zod schemas)                                         │  │   │
│   │   │  • SQL injection prevention (Prisma ORM)                                  │  │   │
│   │   │  • XSS prevention (React escaping)                                        │  │   │
│   │   │  • CSRF protection                                                        │  │   │
│   │   └──────────────────────────────────────────────────────────────────────────┘  │   │
│   │                                        │                                         │   │
│   │                                        ▼                                         │   │
│   │   ┌──────────────────────────────────────────────────────────────────────────┐  │   │
│   │   │  Layer 4: Data Security                                                    │  │   │
│   │   │  • Encryption at rest (AES-256)                                           │  │   │
│   │   │  • Encryption in transit (TLS)                                            │  │   │
│   │   │  • Field-level encryption (SSN, bank accounts)                            │  │   │
│   │   │  • Key management (AWS KMS)                                               │  │   │
│   │   └──────────────────────────────────────────────────────────────────────────┘  │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          COMPLIANCE & AUDIT                                      │   │
│   │                                                                                  │   │
│   │   Attorney-Client Privilege Protection:                                         │   │
│   │   ┌────────────────────────────────────────────────────────────────────────┐    │   │
│   │   │                                                                          │    │   │
│   │   │   • Complete data isolation between tenants                             │    │   │
│   │   │   • No cross-tenant data access possible                                │    │   │
│   │   │   • Audit logging of all access                                         │    │   │
│   │   │   • Data retention policies per state bar requirements                  │    │   │
│   │   │   • Secure data export/deletion on account closure                      │    │   │
│   │   │                                                                          │    │   │
│   │   └────────────────────────────────────────────────────────────────────────┘    │   │
│   │                                                                                  │   │
│   │   Audit Trail:                                                                  │   │
│   │   ┌────────────────────────────────────────────────────────────────────────┐    │   │
│   │   │                                                                          │    │   │
│   │   │   All actions logged:                                                   │    │   │
│   │   │   • User ID                                                              │    │   │
│   │   │   • Action type                                                          │    │   │
│   │   │   • Resource affected                                                    │    │   │
│   │   │   • Timestamp                                                            │    │   │
│   │   │   • IP address                                                           │    │   │
│   │   │   • Before/after values (for updates)                                    │    │   │
│   │   │                                                                          │    │   │
│   │   │   Retention: 7 years (per legal requirements)                           │    │   │
│   │   │                                                                          │    │   │
│   │   └────────────────────────────────────────────────────────────────────────┘    │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          BACKUP & DISASTER RECOVERY                              │   │
│   │                                                                                  │   │
│   │   ┌────────────────────────────────────────────────────────────────────────┐    │   │
│   │   │                                                                          │    │   │
│   │   │   Database:                                                              │    │   │
│   │   │   • Automated daily backups (RDS)                                        │    │   │
│   │   │   • Point-in-time recovery (35 days)                                     │    │   │
│   │   │   • Cross-region replication                                             │    │   │
│   │   │                                                                          │    │   │
│   │   │   Documents:                                                             │    │   │
│   │   │   • S3 versioning enabled                                                │    │   │
│   │   │   • Cross-region replication                                             │    │   │
│   │   │   • Lifecycle policies for archival                                      │    │   │
│   │   │                                                                          │    │   │
│   │   │   RPO (Recovery Point Objective): 1 hour                                │    │   │
│   │   │   RTO (Recovery Time Objective): 4 hours                                │    │   │
│   │   │                                                                          │    │   │
│   │   └────────────────────────────────────────────────────────────────────────┘    │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Summary

This architecture document provides a comprehensive view of the Small Law Firm AI platform:

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14, React 18, Tailwind CSS, Shadcn UI |
| Backend | Node.js, Next.js API Routes, Prisma ORM, tRPC |
| Database | PostgreSQL (RDS), Redis (ElastiCache) |
| Storage | AWS S3, Elasticsearch |
| AI | Claude (Sonnet), OpenAI (Embeddings), Deepgram, ElevenLabs |
| Hosting | Vercel, AWS, Cloudflare |
| Payments | Stripe |
| Communication | Twilio, SendGrid |

Key architectural decisions:
1. **Multi-tenant with RLS** - Row-level security for tenant isolation
2. **Serverless-first** - Vercel + AWS Lambda for auto-scaling
3. **AI-first design** - AI services as core, not add-on
4. **Event-driven** - Webhooks for integrations
5. **Security by default** - Encryption, audit logs, RBAC

