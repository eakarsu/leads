# Healthcare Practice AI - Architecture Diagrams

## Table of Contents
1. [High-Level System Architecture](#1-high-level-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Database Schema](#3-database-schema)
4. [API Architecture](#4-api-architecture)
5. [AI Services Architecture](#5-ai-services-architecture)
6. [HIPAA Compliance Architecture](#6-hipaa-compliance-architecture)
7. [Patient Flow Architecture](#7-patient-flow-architecture)
8. [Clinical Documentation Architecture](#8-clinical-documentation-architecture)
9. [Billing & Claims Architecture](#9-billing--claims-architecture)
10. [Integration Architecture](#10-integration-architecture)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Security & Audit Architecture](#12-security--audit-architecture)

---

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENT LAYER                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│   │  Provider    │    │   Staff      │    │   Patient    │    │   Kiosk      │          │
│   │  Dashboard   │    │  Dashboard   │    │   Portal     │    │  Check-in    │          │
│   │   (React)    │    │   (React)    │    │   (React)    │    │   (React)    │          │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘          │
│          │                   │                   │                   │                   │
│   ┌──────────────┐    ┌──────────────┐                                                  │
│   │  Mobile App  │    │  AI Scribe   │                                                  │
│   │(React Native)│    │   (iPad)     │                                                  │
│   └──────┬───────┘    └──────┬───────┘                                                  │
│          │                   │                                                           │
└──────────┼───────────────────┼───────────────────────────────────────────────────────────┘
           │                   │
           └───────────────────┴───────────────────────────────────────────
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              HIPAA-COMPLIANT API GATEWAY                                 │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                    AWS API Gateway + WAF + Shield                                │   │
│   │   • PHI Encryption  • Audit Logging  • Rate Limiting  • IP Filtering            │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 APPLICATION LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                    CORE HEALTHCARE API (Node.js / Next.js)                       │   │
│   │   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐         │   │
│   │   │  Patient  │ │Appointment│ │ Clinical  │ │  Billing  │ │ Insurance │         │   │
│   │   │  Service  │ │  Service  │ │  Service  │ │  Service  │ │  Service  │         │   │
│   │   └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘         │   │
│   │   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐         │   │
│   │   │  Claims   │ │  Portal   │ │  Reports  │ │ Inventory │ │   Staff   │         │   │
│   │   │  Service  │ │  Service  │ │  Service  │ │  Service  │ │  Service  │         │   │
│   │   └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘         │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                               │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         HEALTHCARE AI SERVICES                                   │   │
│   │   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │   │
│   │   │ AI Scribe  │ │ AI Billing │ │ AI Denial  │ │  AI Voice  │ │ AI Patient │    │   │
│   │   │(Real-time) │ │   Coder    │ │ Predictor  │ │Receptionist│ │   Recall   │    │   │
│   │   └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘    │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              HIPAA-COMPLIANT DATA LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│   │  PostgreSQL  │    │    Redis     │    │   AWS S3     │    │  Pinecone    │          │
│   │  (RDS + KMS) │    │(ElastiCache) │    │ (Encrypted)  │    │  (Vectors)   │          │
│   │   + PHI      │    │  No PHI      │    │ Medical Docs │    │ Embeddings   │          │
│   └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘          │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          HEALTHCARE INTEGRATIONS (BAA Required)                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │
│   │Clearing│ │  Lab   │ │  EHR   │ │ Stripe │ │ Twilio │ │Pharmacy│ │ Imaging│         │
│   │ house  │ │Systems │ │(HL7/FH)│ │(HIPAA) │ │(HIPAA) │ │  (NCPDP)│ │(DICOM) │         │
│   └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘         │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        HEALTHCARE TECHNOLOGY STACK                                       │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              FRONTEND                                            │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │    │
│  │  │   Next.js   │ │    React    │ │  Tailwind   │ │   Shadcn    │               │    │
│  │  │     14      │ │     18      │ │     CSS     │ │     UI      │               │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘               │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │    │
│  │  │React Native │ │  FullCalendar│ │   Chart.js  │ │  PDF.js     │               │    │
│  │  │ (Mobile)    │ │ (Scheduling)│ │  (Reports)  │ │ (Documents) │               │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              BACKEND                                             │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │    │
│  │  │   Node.js   │ │   Next.js   │ │   Prisma    │ │    tRPC     │               │    │
│  │  │     20      │ │  API Routes │ │     ORM     │ │ (Type-safe) │               │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘               │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │    │
│  │  │   BullMQ    │ │   HL7.js    │ │  FHIR.js    │ │   X12.js    │               │    │
│  │  │   (Queue)   │ │ (HL7 Parse) │ │(FHIR Parse) │ │(EDI Claims) │               │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          HEALTHCARE-SPECIFIC                                     │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │    │
│  │  │   ICD-10    │ │    CPT      │ │   SNOMED    │ │   RxNorm    │               │    │
│  │  │  Database   │ │  Database   │ │     CT      │ │  (Drugs)    │               │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘               │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │    │
│  │  │   NPI       │ │   CLIA      │ │   NUCC      │ │   HCPCS     │               │    │
│  │  │  Registry   │ │  Registry   │ │ Taxonomy    │ │   Codes     │               │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              AI / ML SERVICES                                    │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │    │
│  │  │   Claude    │ │  Whisper/   │ │  ElevenLabs │ │ AWS Textract│               │    │
│  │  │  (Medical)  │ │  Deepgram   │ │    (TTS)    │ │   (OCR)     │               │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘               │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                               │    │
│  │  │ AWS Compre- │ │   Custom    │ │   Pinecone  │                               │    │
│  │  │ hend Medical│ │   Models    │ │  (Vectors)  │                               │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘                               │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                        HIPAA-COMPLIANT INFRASTRUCTURE                            │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │    │
│  │  │  AWS HIPAA  │ │  AWS KMS    │ │CloudTrail   │ │   Vercel    │               │    │
│  │  │  Eligible   │ │(Encryption) │ │  (Audit)    │ │  (HIPAA)    │               │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          HEALTHCARE DATABASE SCHEMA                                      │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              CORE TABLES                                         │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌──────────────────────┐          ┌──────────────────────┐                             │
│  │      practices       │          │       providers      │                             │
│  ├──────────────────────┤          ├──────────────────────┤                             │
│  │ id            UUID PK│◄─────────│ practice_id   UUID FK│                             │
│  │ name          VARCHAR│          │ id            UUID PK│                             │
│  │ npi           VARCHAR│          │ first_name    VARCHAR│                             │
│  │ tax_id        VARCHAR(enc)      │ last_name     VARCHAR│                             │
│  │ specialty     ENUM   │          │ npi           VARCHAR│                             │
│  │ address       JSONB  │          │ license_number VARCHAR                             │
│  │ phone         VARCHAR│          │ specialty     ENUM   │                             │
│  │ settings      JSONB  │          │ schedule      JSONB  │                             │
│  │ created_at    TIMESTAMP         │ created_at    TIMESTAMP                            │
│  └──────────────────────┘          └──────────────────────┘                             │
│           │                                   │                                          │
│           ▼                                   ▼                                          │
│  ┌──────────────────────┐          ┌──────────────────────┐                             │
│  │       patients       │          │     appointments     │                             │
│  ├──────────────────────┤          ├──────────────────────┤                             │
│  │ id            UUID PK│◄─────────│ patient_id    UUID FK│                             │
│  │ practice_id   UUID FK│          │ id            UUID PK│                             │
│  │ mrn           VARCHAR│          │ provider_id   UUID FK│                             │
│  │ first_name    VARCHAR│          │ practice_id   UUID FK│                             │
│  │ last_name     VARCHAR│          │ start_time    TIMESTAMP                            │
│  │ dob           DATE   │          │ end_time      TIMESTAMP                            │
│  │ ssn           VARCHAR(enc)      │ type          ENUM   │                             │
│  │ gender        ENUM   │          │ status        ENUM   │                             │
│  │ email         VARCHAR│          │ chief_complaint VARCHAR                            │
│  │ phone         VARCHAR│          │ notes         TEXT   │                             │
│  │ address       JSONB  │          │ created_at    TIMESTAMP                            │
│  │ emergency_contact JSONB         └──────────────────────┘                             │
│  │ created_at    TIMESTAMP                                                               │
│  └──────────────────────┘                                                                │
│           │                                                                              │
│           ▼                                                                              │
│  ┌──────────────────────┐          ┌──────────────────────┐                             │
│  │   patient_insurance  │          │      encounters      │                             │
│  ├──────────────────────┤          ├──────────────────────┤                             │
│  │ id            UUID PK│          │ id            UUID PK│                             │
│  │ patient_id    UUID FK│          │ patient_id    UUID FK│                             │
│  │ priority      ENUM   │          │ provider_id   UUID FK│                             │
│  │ payer_name    VARCHAR│          │ appointment_id UUID FK                             │
│  │ payer_id      VARCHAR│          │ date          DATE   │                             │
│  │ member_id     VARCHAR│          │ status        ENUM   │                             │
│  │ group_number  VARCHAR│          │ chief_complaint TEXT │                             │
│  │ subscriber    JSONB  │          │ soap_note     JSONB  │                             │
│  │ copay         DECIMAL│          │ diagnoses     JSONB  │                             │
│  │ deductible    DECIMAL│          │ procedures    JSONB  │                             │
│  │ verified_at   TIMESTAMP         │ vitals        JSONB  │                             │
│  │ created_at    TIMESTAMP         │ signed_at     TIMESTAMP                            │
│  └──────────────────────┘          │ signed_by     UUID FK│                             │
│                                    │ created_at    TIMESTAMP                            │
│                                    └──────────────────────┘                             │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                           BILLING TABLES                                         │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌──────────────────────┐          ┌──────────────────────┐                             │
│  │        claims        │          │    claim_lines       │                             │
│  ├──────────────────────┤          ├──────────────────────┤                             │
│  │ id            UUID PK│◄─────────│ claim_id      UUID FK│                             │
│  │ practice_id   UUID FK│          │ id            UUID PK│                             │
│  │ patient_id    UUID FK│          │ cpt_code      VARCHAR│                             │
│  │ encounter_id  UUID FK│          │ modifiers     VARCHAR[]                            │
│  │ payer_id      VARCHAR│          │ icd10_codes   VARCHAR[]                            │
│  │ claim_number  VARCHAR│          │ units         INTEGER│                             │
│  │ status        ENUM   │          │ charge        DECIMAL│                             │
│  │ total_charge  DECIMAL│          │ allowed       DECIMAL│                             │
│  │ total_paid    DECIMAL│          │ paid          DECIMAL│                             │
│  │ submission_date DATE │          │ adjustment    DECIMAL│                             │
│  │ era_date      DATE   │          │ denial_code   VARCHAR│                             │
│  │ created_at    TIMESTAMP         │ created_at    TIMESTAMP                            │
│  └──────────────────────┘          └──────────────────────┘                             │
│                                                                                          │
│  ┌──────────────────────┐          ┌──────────────────────┐                             │
│  │   patient_ledger     │          │      payments        │                             │
│  ├──────────────────────┤          ├──────────────────────┤                             │
│  │ id            UUID PK│          │ id            UUID PK│                             │
│  │ patient_id    UUID FK│          │ patient_id    UUID FK│                             │
│  │ encounter_id  UUID FK│          │ ledger_id     UUID FK│                             │
│  │ type          ENUM   │          │ amount        DECIMAL│                             │
│  │ amount        DECIMAL│          │ method        ENUM   │                             │
│  │ balance       DECIMAL│          │ stripe_id     VARCHAR│                             │
│  │ description   VARCHAR│          │ status        ENUM   │                             │
│  │ created_at    TIMESTAMP         │ created_at    TIMESTAMP                            │
│  └──────────────────────┘          └──────────────────────┘                             │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                         CLINICAL TABLES                                          │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌──────────────────────┐          ┌──────────────────────┐                             │
│  │    medical_history   │          │     medications      │                             │
│  ├──────────────────────┤          ├──────────────────────┤                             │
│  │ id            UUID PK│          │ id            UUID PK│                             │
│  │ patient_id    UUID FK│          │ patient_id    UUID FK│                             │
│  │ conditions    JSONB  │          │ name          VARCHAR│                             │
│  │ surgeries     JSONB  │          │ rxnorm_code   VARCHAR│                             │
│  │ allergies     JSONB  │          │ dosage        VARCHAR│                             │
│  │ family_history JSONB │          │ frequency     VARCHAR│                             │
│  │ social_history JSONB │          │ prescriber_id UUID FK│                             │
│  │ immunizations JSONB  │          │ status        ENUM   │                             │
│  │ updated_at    TIMESTAMP         │ start_date    DATE   │                             │
│  └──────────────────────┘          │ end_date      DATE   │                             │
│                                    │ created_at    TIMESTAMP                            │
│  ┌──────────────────────┐          └──────────────────────┘                             │
│  │     lab_results      │                                                                │
│  ├──────────────────────┤          ┌──────────────────────┐                             │
│  │ id            UUID PK│          │   treatment_plans    │                             │
│  │ patient_id    UUID FK│          ├──────────────────────┤                             │
│  │ encounter_id  UUID FK│          │ id            UUID PK│                             │
│  │ test_name     VARCHAR│          │ patient_id    UUID FK│                             │
│  │ loinc_code    VARCHAR│          │ provider_id   UUID FK│                             │
│  │ value         VARCHAR│          │ title         VARCHAR│                             │
│  │ unit          VARCHAR│          │ goals         JSONB  │                             │
│  │ reference_range VARCHAR         │ interventions JSONB  │                             │
│  │ abnormal_flag ENUM   │          │ status        ENUM   │                             │
│  │ collected_at  TIMESTAMP         │ created_at    TIMESTAMP                            │
│  │ created_at    TIMESTAMP         └──────────────────────┘                             │
│  └──────────────────────┘                                                                │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. API Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                            HEALTHCARE API ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              API ENDPOINTS                                       │    │
│  │                                                                                  │    │
│  │  /api/v1                                                                        │    │
│  │  ├── /patients                                                                  │    │
│  │  │   ├── GET    /                         # List patients                       │    │
│  │  │   ├── POST   /                         # Create patient                      │    │
│  │  │   ├── GET    /:id                      # Get patient                         │    │
│  │  │   ├── PUT    /:id                      # Update patient                      │    │
│  │  │   ├── GET    /:id/appointments         # Patient appointments               │    │
│  │  │   ├── GET    /:id/encounters           # Patient encounters                 │    │
│  │  │   ├── GET    /:id/insurance            # Patient insurance                  │    │
│  │  │   ├── GET    /:id/ledger               # Patient billing                    │    │
│  │  │   └── GET    /:id/documents            # Patient documents                  │    │
│  │  │                                                                              │    │
│  │  ├── /appointments                                                              │    │
│  │  │   ├── GET    /                         # List appointments                  │    │
│  │  │   ├── POST   /                         # Create appointment                 │    │
│  │  │   ├── GET    /:id                      # Get appointment                    │    │
│  │  │   ├── PUT    /:id                      # Update appointment                 │    │
│  │  │   ├── POST   /:id/check-in             # Check in patient                   │    │
│  │  │   ├── POST   /:id/check-out            # Check out patient                  │    │
│  │  │   └── GET    /availability             # Provider availability              │    │
│  │  │                                                                              │    │
│  │  ├── /encounters                                                                │    │
│  │  │   ├── GET    /                         # List encounters                    │    │
│  │  │   ├── POST   /                         # Create encounter                   │    │
│  │  │   ├── GET    /:id                      # Get encounter                      │    │
│  │  │   ├── PUT    /:id                      # Update encounter                   │    │
│  │  │   ├── POST   /:id/sign                 # Sign/lock encounter               │    │
│  │  │   └── POST   /:id/addendum             # Add addendum                       │    │
│  │  │                                                                              │    │
│  │  ├── /billing                                                                   │    │
│  │  │   ├── GET    /claims                   # List claims                        │    │
│  │  │   ├── POST   /claims                   # Create claim                       │    │
│  │  │   ├── POST   /claims/:id/submit        # Submit to clearinghouse           │    │
│  │  │   ├── GET    /claims/:id/status        # Check claim status                │    │
│  │  │   ├── POST   /eligibility              # Check eligibility                 │    │
│  │  │   ├── GET    /superbill/:encounter_id  # Generate superbill                │    │
│  │  │   └── GET    /era                      # Process ERA/EOB                   │    │
│  │  │                                                                              │    │
│  │  ├── /payments                                                                  │    │
│  │  │   ├── POST   /                         # Collect payment                    │    │
│  │  │   ├── POST   /plan                     # Setup payment plan                │    │
│  │  │   └── GET    /patient/:id              # Patient payment history           │    │
│  │  │                                                                              │    │
│  │  ├── /clinical                                                                  │    │
│  │  │   ├── GET    /icd10/search             # Search ICD-10 codes               │    │
│  │  │   ├── GET    /cpt/search               # Search CPT codes                  │    │
│  │  │   ├── GET    /drugs/search             # Search medications                │    │
│  │  │   └── GET    /allergies/search         # Search allergens                  │    │
│  │  │                                                                              │    │
│  │  ├── /portal                              # Patient portal endpoints           │    │
│  │  │   ├── GET    /appointments             # My appointments                   │    │
│  │  │   ├── POST   /appointments             # Request appointment               │    │
│  │  │   ├── GET    /messages                 # My messages                        │    │
│  │  │   ├── POST   /messages                 # Send message                       │    │
│  │  │   ├── GET    /forms                    # Intake forms                       │    │
│  │  │   └── POST   /forms/:id                # Submit form                        │    │
│  │  │                                                                              │    │
│  │  └── /ai                                                                        │    │
│  │      ├── POST   /scribe/start             # Start AI scribe session           │    │
│  │      ├── POST   /scribe/audio             # Send audio chunk                  │    │
│  │      ├── POST   /scribe/finalize          # Generate SOAP note               │    │
│  │      ├── POST   /coding                   # AI billing code suggestions       │    │
│  │      ├── POST   /denial-risk              # Predict denial risk              │    │
│  │      └── POST   /prior-auth               # AI prior auth assistance         │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. AI Services Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          HEALTHCARE AI SERVICES                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              AI SCRIBE ARCHITECTURE                              │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                         Real-Time Audio Pipeline                        │    │    │
│  │   │                                                                          │    │    │
│  │   │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐         │    │    │
│  │   │   │  Audio   │───►│ Deepgram │───►│ Speaker  │───►│  Medical │         │    │    │
│  │   │   │  Stream  │    │   STT    │    │ Diarize  │    │  NER     │         │    │    │
│  │   │   └──────────┘    └──────────┘    └──────────┘    └──────────┘         │    │    │
│  │   │                                                          │               │    │    │
│  │   │                                                          ▼               │    │    │
│  │   │                                                   ┌──────────────┐      │    │    │
│  │   │                                                   │   Claude     │      │    │    │
│  │   │                                                   │ (Medical LLM)│      │    │    │
│  │   │                                                   └──────┬───────┘      │    │    │
│  │   │                                                          │               │    │    │
│  │   └──────────────────────────────────────────────────────────┼───────────────┘    │    │
│  │                                                              │                    │    │
│  │                                                              ▼                    │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                         SOAP Note Generation                            │    │    │
│  │   │                                                                          │    │    │
│  │   │   ┌─────────────────────────────────────────────────────────────────┐   │    │    │
│  │   │   │  S - Subjective                                                  │   │    │    │
│  │   │   │  • Chief Complaint: "Patient reports chest pain for 2 days"      │   │    │    │
│  │   │   │  • HPI: 45yo male presenting with...                             │   │    │    │
│  │   │   │  • ROS: Denies fever, confirms shortness of breath               │   │    │    │
│  │   │   ├─────────────────────────────────────────────────────────────────┤   │    │    │
│  │   │   │  O - Objective                                                   │   │    │    │
│  │   │   │  • Vitals: BP 140/90, HR 88, Temp 98.6°F                         │   │    │    │
│  │   │   │  • Physical Exam: Heart RRR, Lungs clear bilateral               │   │    │    │
│  │   │   ├─────────────────────────────────────────────────────────────────┤   │    │    │
│  │   │   │  A - Assessment                                                  │   │    │    │
│  │   │   │  • Chest pain, unspecified (R07.9)                               │   │    │    │
│  │   │   │  • Hypertension (I10)                                            │   │    │    │
│  │   │   ├─────────────────────────────────────────────────────────────────┤   │    │    │
│  │   │   │  P - Plan                                                        │   │    │    │
│  │   │   │  • EKG ordered, Troponin ordered                                 │   │    │    │
│  │   │   │  • Follow-up in 1 week                                           │   │    │    │
│  │   │   └─────────────────────────────────────────────────────────────────┘   │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                           AI BILLING CODER                                       │    │
│  │                                                                                  │    │
│  │   ┌──────────┐    ┌──────────────────────────────────────────────────────────┐  │    │
│  │   │  SOAP    │    │                  Coding Engine                            │  │    │
│  │   │  Note    │───►│                                                            │  │    │
│  │   └──────────┘    │  ┌────────────┐  ┌────────────┐  ┌────────────┐          │  │    │
│  │                   │  │  Extract   │  │   Match    │  │  Validate  │          │  │    │
│  │                   │  │  Diagnoses │─►│  ICD-10    │─►│  Medical   │          │  │    │
│  │                   │  │            │  │   Codes    │  │ Necessity  │          │  │    │
│  │                   │  └────────────┘  └────────────┘  └────────────┘          │  │    │
│  │                   │                                                            │  │    │
│  │                   │  ┌────────────┐  ┌────────────┐  ┌────────────┐          │  │    │
│  │                   │  │  Extract   │  │   Match    │  │   Check    │          │  │    │
│  │                   │  │ Procedures │─►│    CPT     │─►│  Modifiers │          │  │    │
│  │                   │  │            │  │   Codes    │  │            │          │  │    │
│  │                   │  └────────────┘  └────────────┘  └────────────┘          │  │    │
│  │                   │                                                            │  │    │
│  │                   └──────────────────────────────────────────────────────────┘  │    │
│  │                                          │                                       │    │
│  │                                          ▼                                       │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │  Output:                                                                │    │    │
│  │   │  • CPT: 99214 (Office visit, established, moderate complexity)         │    │    │
│  │   │  • ICD-10: R07.9 (Chest pain), I10 (Hypertension)                       │    │    │
│  │   │  • Confidence: 95%                                                      │    │    │
│  │   │  • Documentation sufficient: YES                                        │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          AI DENIAL PREDICTOR                                     │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                      Pre-Submission Analysis                            │    │    │
│  │   │                                                                          │    │    │
│  │   │   Input:                         Risk Assessment:                        │    │    │
│  │   │   ├── Claim data                 ├── Missing prior auth      HIGH        │    │    │
│  │   │   ├── Payer rules                ├── Non-covered service     MEDIUM      │    │    │
│  │   │   ├── Historical denials         ├── Coding mismatch         LOW         │    │    │
│  │   │   ├── Documentation              ├── Timely filing risk      LOW         │    │    │
│  │   │   └── LCD/NCD requirements       └── Medical necessity       OK          │    │    │
│  │   │                                                                          │    │    │
│  │   │   Overall Risk Score: 7.2/10 - HIGH RISK                                │    │    │
│  │   │                                                                          │    │    │
│  │   │   Recommendations:                                                       │    │    │
│  │   │   1. Obtain prior authorization before submission                        │    │    │
│  │   │   2. Add modifier 25 to E/M code                                        │    │    │
│  │   │   3. Include medical necessity documentation                            │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          AI VOICE RECEPTIONIST                                   │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                      Healthcare Call Handling                           │    │    │
│  │   │                                                                          │    │    │
│  │   │   Intent              Response                                          │    │    │
│  │   │   ──────────────────────────────────────────────────────────────────── │    │    │
│  │   │   Schedule Appt   →   Check availability, book, confirm                 │    │    │
│  │   │   Prescription    →   Route to nurse/provider message                   │    │    │
│  │   │   Test Results    →   "Results are ready, schedule follow-up"           │    │    │
│  │   │   Billing         →   Route to billing department                       │    │    │
│  │   │   Emergency       →   "Please hang up and call 911" + alert staff       │    │    │
│  │   │   After Hours     →   Take message, provide on-call info                │    │    │
│  │   │                                                                          │    │    │
│  │   │   HIPAA Verification:                                                   │    │    │
│  │   │   • Verify DOB before discussing PHI                                    │    │    │
│  │   │   • Never leave detailed voicemail unless authorized                    │    │    │
│  │   │   • Log all calls for compliance                                        │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. HIPAA Compliance Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          HIPAA COMPLIANCE ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          TECHNICAL SAFEGUARDS                                    │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │  Access Controls (§ 164.312(a)(1))                                      │    │    │
│  │   │                                                                          │    │    │
│  │   │   • Unique User Identification                                          │    │    │
│  │   │     └── Every user has unique UUID, no shared accounts                  │    │    │
│  │   │   • Emergency Access Procedure                                          │    │    │
│  │   │     └── Break-glass access with full audit logging                      │    │    │
│  │   │   • Automatic Logoff                                                    │    │    │
│  │   │     └── 15-minute session timeout, immediate on window close            │    │    │
│  │   │   • Encryption & Decryption                                             │    │    │
│  │   │     └── AES-256 for PHI at rest, TLS 1.3 in transit                    │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │  Audit Controls (§ 164.312(b))                                          │    │    │
│  │   │                                                                          │    │    │
│  │   │   ┌──────────────────────────────────────────────────────────────────┐  │    │    │
│  │   │   │                    Audit Log Entry                                │  │    │    │
│  │   │   │  {                                                                │  │    │    │
│  │   │   │    "timestamp": "2024-01-15T14:30:00Z",                           │  │    │    │
│  │   │   │    "user_id": "uuid",                                             │  │    │    │
│  │   │   │    "action": "patient.view",                                      │  │    │    │
│  │   │   │    "resource_type": "patient",                                    │  │    │    │
│  │   │   │    "resource_id": "patient-uuid",                                 │  │    │    │
│  │   │   │    "ip_address": "192.168.1.1",                                   │  │    │    │
│  │   │   │    "user_agent": "Mozilla/5.0...",                                │  │    │    │
│  │   │   │    "phi_accessed": true,                                          │  │    │    │
│  │   │   │    "reason": "patient_care"                                       │  │    │    │
│  │   │   │  }                                                                │  │    │    │
│  │   │   └──────────────────────────────────────────────────────────────────┘  │    │    │
│  │   │                                                                          │    │    │
│  │   │   • All PHI access logged to CloudTrail                                 │    │    │
│  │   │   • Logs retained for 6 years (HIPAA requirement)                       │    │    │
│  │   │   • Tamper-proof storage (S3 Object Lock)                               │    │    │
│  │   │   • Regular audit log review process                                    │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │  Transmission Security (§ 164.312(e)(1))                                │    │    │
│  │   │                                                                          │    │    │
│  │   │   ┌────────────────────────────────────────────────────────────────┐    │    │    │
│  │   │   │                  Encryption Layers                              │    │    │    │
│  │   │   │                                                                  │    │    │    │
│  │   │   │   Browser ──[TLS 1.3]──► API Gateway ──[TLS]──► Application    │    │    │    │
│  │   │   │                                                    │            │    │    │    │
│  │   │   │                                          ──[TLS]──► Database   │    │    │    │
│  │   │   │                                          ──[TLS]──► S3         │    │    │    │
│  │   │   │                                          ──[TLS]──► Redis      │    │    │    │
│  │   │   │                                                                  │    │    │    │
│  │   │   └────────────────────────────────────────────────────────────────┘    │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          PHI DATA FLOW                                           │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                                                                          │    │    │
│  │   │   PHI Categories:                                                       │    │    │
│  │   │   ├── Patient identifiers (name, DOB, SSN, MRN)                         │    │    │
│  │   │   ├── Contact information                                               │    │    │
│  │   │   ├── Medical records (encounters, notes)                               │    │    │
│  │   │   ├── Insurance information                                             │    │    │
│  │   │   ├── Payment information                                               │    │    │
│  │   │   └── Photos/images                                                     │    │    │
│  │   │                                                                          │    │    │
│  │   │   Storage:                                                              │    │    │
│  │   │   ┌────────────────┬────────────────┬────────────────┐                 │    │    │
│  │   │   │   Database     │      S3        │     Redis      │                 │    │    │
│  │   │   │   (RDS + KMS)  │  (SSE-KMS)     │   (No PHI)     │                 │    │    │
│  │   │   │                │                │                 │                 │    │    │
│  │   │   │ • Patient data │ • Documents    │ • Session data │                 │    │    │
│  │   │   │ • Encounters   │ • Images       │ • Cache only   │                 │    │    │
│  │   │   │ • Claims       │ • Lab results  │ • Ephemeral    │                 │    │    │
│  │   │   │                │                │                 │                 │    │    │
│  │   │   │ Encrypted ✓    │ Encrypted ✓    │ No PHI ✓       │                 │    │    │
│  │   │   └────────────────┴────────────────┴────────────────┘                 │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          BAA MANAGEMENT                                          │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                                                                          │    │    │
│  │   │   Required BAAs:                                                        │    │    │
│  │   │   ┌────────────────┬────────────────┬────────────────┐                 │    │    │
│  │   │   │   Vendor       │     Service    │   BAA Status   │                 │    │    │
│  │   │   ├────────────────┼────────────────┼────────────────┤                 │    │    │
│  │   │   │   AWS          │   All services │   ✓ Active     │                 │    │    │
│  │   │   │   Vercel       │   Hosting      │   ✓ Active     │                 │    │    │
│  │   │   │   Stripe       │   Payments     │   ✓ Active     │                 │    │    │
│  │   │   │   Twilio       │   Voice/SMS    │   ✓ Active     │                 │    │    │
│  │   │   │   SendGrid     │   Email        │   ✓ Active     │                 │    │    │
│  │   │   │   Anthropic    │   AI (Claude)  │   ✓ Active     │                 │    │    │
│  │   │   │   Clearinghouse│   Claims       │   ✓ Active     │                 │    │    │
│  │   │   └────────────────┴────────────────┴────────────────┘                 │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Patient Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          PATIENT FLOW ARCHITECTURE                                       │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          PATIENT JOURNEY                                         │    │
│  │                                                                                  │    │
│  │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │    │
│  │   │  Online  │───►│  Intake  │───►│ Check-In │───►│  Visit   │───►│ Check-Out│ │    │
│  │   │ Booking  │    │  Forms   │    │          │    │          │    │          │ │    │
│  │   └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘ │    │
│  │        │              │               │               │               │         │    │
│  │        ▼              ▼               ▼               ▼               ▼         │    │
│  │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │    │
│  │   │Reminders │    │Insurance │    │  Copay   │    │   SOAP   │    │  Billing │ │    │
│  │   │ (SMS)    │    │Verify    │    │Collection│    │   Note   │    │  & Next  │ │    │
│  │   └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘ │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          ONLINE BOOKING FLOW                                     │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                                                                          │    │    │
│  │   │   Patient Portal / Website Widget                                       │    │    │
│  │   │   ┌────────────────────────────────────────────────────────────────┐   │    │    │
│  │   │   │                                                                  │   │    │    │
│  │   │   │   1. Select Reason for Visit                                    │   │    │    │
│  │   │   │      [ ] New Patient Exam                                       │   │    │    │
│  │   │   │      [x] Follow-up Visit                                        │   │    │    │
│  │   │   │      [ ] Urgent Concern                                         │   │    │    │
│  │   │   │                                                                  │   │    │    │
│  │   │   │   2. Select Provider (optional)                                 │   │    │    │
│  │   │   │      [Dr. Smith] [Dr. Jones] [Any Available]                    │   │    │    │
│  │   │   │                                                                  │   │    │    │
│  │   │   │   3. Select Date & Time                                         │   │    │    │
│  │   │   │      January 2024                                               │   │    │    │
│  │   │   │      [15] [16] [17] [18] [19]                                   │   │    │    │
│  │   │   │      Available: 9:00 AM | 10:30 AM | 2:00 PM                    │   │    │    │
│  │   │   │                                                                  │   │    │    │
│  │   │   │   4. Confirm Appointment                                        │   │    │    │
│  │   │   │      [Book Appointment]                                         │   │    │    │
│  │   │   │                                                                  │   │    │    │
│  │   │   └────────────────────────────────────────────────────────────────┘   │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          KIOSK CHECK-IN FLOW                                     │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                                                                          │    │    │
│  │   │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐         │    │    │
│  │   │   │ Identify │───►│  Verify  │───►│  Update  │───►│  Copay   │         │    │    │
│  │   │   │ Patient  │    │Insurance │    │  Info    │    │ Payment  │         │    │    │
│  │   │   └──────────┘    └──────────┘    └──────────┘    └──────────┘         │    │    │
│  │   │        │                                               │                │    │    │
│  │   │        │         DOB + Name                            │                │    │    │
│  │   │        │         or                              Card on File           │    │    │
│  │   │        │         QR Code                         or                     │    │    │
│  │   │        │         from SMS                        New Payment            │    │    │
│  │   │        │                                                                │    │    │
│  │   │        ▼                                               ▼                │    │    │
│  │   │   ┌──────────────────────────────────────────────────────────┐         │    │    │
│  │   │   │                   Check-In Complete                       │         │    │    │
│  │   │   │                                                            │         │    │    │
│  │   │   │   "Thank you, Mary! Dr. Smith will see you shortly.       │         │    │    │
│  │   │   │    Please have a seat in the waiting area."               │         │    │    │
│  │   │   │                                                            │         │    │    │
│  │   │   │   Staff notified: Patient ready in waiting room           │         │    │    │
│  │   │   │                                                            │         │    │    │
│  │   │   └──────────────────────────────────────────────────────────┘         │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          APPOINTMENT REMINDERS                                   │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                                                                          │    │    │
│  │   │   Timeline:                                                             │    │    │
│  │   │                                                                          │    │    │
│  │   │   7 days    │    2 days    │    1 day     │    2 hours   │   Appt      │    │    │
│  │   │   before    │    before    │    before    │    before    │             │    │    │
│  │   │      │           │             │              │           │             │    │    │
│  │   │      ▼           ▼             ▼              ▼           ▼             │    │    │
│  │   │   ┌─────┐    ┌─────┐      ┌──────┐      ┌──────┐    ┌─────────┐       │    │    │
│  │   │   │Email│    │ SMS │      │ SMS  │      │ SMS  │    │ Arrival │       │    │    │
│  │   │   │     │    │     │      │Confirm     │      │    │  Time   │       │    │    │
│  │   │   └─────┘    └─────┘      └──────┘      └──────┘    └─────────┘       │    │    │
│  │   │                              │                                         │    │    │
│  │   │                              ▼                                         │    │    │
│  │   │                    Patient confirms (Y/N)                              │    │    │
│  │   │                    If N → Reschedule flow                              │    │    │
│  │   │                    If no response → Staff follow-up                    │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Clinical Documentation Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                       CLINICAL DOCUMENTATION ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          ENCOUNTER WORKFLOW                                      │    │
│  │                                                                                  │    │
│  │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │    │
│  │   │  Start   │───►│  Vitals  │───►│AI Scribe │───►│  Review  │───►│   Sign   │ │    │
│  │   │Encounter │    │  Entry   │    │ Session  │    │   Note   │    │  & Lock  │ │    │
│  │   └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘ │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          AI SCRIBE SESSION                                       │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                    Real-Time Documentation                              │    │    │
│  │   │                                                                          │    │    │
│  │   │   ┌─────────────────────────────────────────────────────────────────┐   │    │    │
│  │   │   │                      iPad / Tablet View                          │   │    │    │
│  │   │   │                                                                   │   │    │    │
│  │   │   │   Patient: Mary Johnson, 45F                                     │   │    │    │
│  │   │   │   ──────────────────────────────────────────────────────────    │   │    │    │
│  │   │   │                                                                   │   │    │    │
│  │   │   │   🎙️ Recording...                                                │   │    │    │
│  │   │   │                                                                   │   │    │    │
│  │   │   │   Live Transcript:                                               │   │    │    │
│  │   │   │   Dr: "How long have you been experiencing the headaches?"       │   │    │    │
│  │   │   │   Pt: "About two weeks now, mostly in the morning."              │   │    │    │
│  │   │   │   Dr: "Any nausea or visual changes?"                            │   │    │    │
│  │   │   │   Pt: "Some nausea, but no vision problems."                     │   │    │    │
│  │   │   │                                                                   │   │    │    │
│  │   │   │   ──────────────────────────────────────────────────────────    │   │    │    │
│  │   │   │                                                                   │   │    │    │
│  │   │   │   AI Extracted:                                                  │   │    │    │
│  │   │   │   • CC: Headaches x 2 weeks                                      │   │    │    │
│  │   │   │   • Location: Not specified                                      │   │    │    │
│  │   │   │   • Timing: Morning                                              │   │    │    │
│  │   │   │   • Associated: Nausea (+), Vision changes (-)                   │   │    │    │
│  │   │   │                                                                   │   │    │    │
│  │   │   │   [Stop Recording]  [Add Note]  [View Full Note]                │   │    │    │
│  │   │   │                                                                   │   │    │    │
│  │   │   └─────────────────────────────────────────────────────────────────┘   │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          SOAP NOTE STRUCTURE                                     │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                                                                          │    │    │
│  │   │   ┌──────────────────────────────────────────────────────────────────┐  │    │    │
│  │   │   │  SUBJECTIVE                                                       │  │    │    │
│  │   │   │  ─────────────────────────────────────────────────────────────── │  │    │    │
│  │   │   │  Chief Complaint: Headaches x 2 weeks                            │  │    │    │
│  │   │   │                                                                   │  │    │    │
│  │   │   │  HPI: 45-year-old female presents with recurrent headaches      │  │    │    │
│  │   │   │  for the past 2 weeks. Pain is described as dull, bilateral,    │  │    │    │
│  │   │   │  predominantly in the morning. Associated with mild nausea.     │  │    │    │
│  │   │   │  No visual changes, photophobia, or neck stiffness.             │  │    │    │
│  │   │   │                                                                   │  │    │    │
│  │   │   │  ROS:                                                            │  │    │    │
│  │   │   │  • Constitutional: Denies fever, weight changes                  │  │    │    │
│  │   │   │  • Neuro: Headaches as above, denies dizziness                  │  │    │    │
│  │   │   │  • GI: Mild nausea, no vomiting                                 │  │    │    │
│  │   │   └──────────────────────────────────────────────────────────────────┘  │    │    │
│  │   │                                                                          │    │    │
│  │   │   ┌──────────────────────────────────────────────────────────────────┐  │    │    │
│  │   │   │  OBJECTIVE                                                        │  │    │    │
│  │   │   │  ─────────────────────────────────────────────────────────────── │  │    │    │
│  │   │   │  Vitals: BP 128/82, HR 72, Temp 98.4°F, SpO2 99%                │  │    │    │
│  │   │   │                                                                   │  │    │    │
│  │   │   │  Physical Exam:                                                  │  │    │    │
│  │   │   │  • General: Alert, oriented, no acute distress                  │  │    │    │
│  │   │   │  • HEENT: PERRL, no papilledema, no sinus tenderness            │  │    │    │
│  │   │   │  • Neck: Supple, no meningismus                                 │  │    │    │
│  │   │   │  • Neuro: CN II-XII intact, no focal deficits                   │  │    │    │
│  │   │   └──────────────────────────────────────────────────────────────────┘  │    │    │
│  │   │                                                                          │    │    │
│  │   │   ┌──────────────────────────────────────────────────────────────────┐  │    │    │
│  │   │   │  ASSESSMENT                                                       │  │    │    │
│  │   │   │  ─────────────────────────────────────────────────────────────── │  │    │    │
│  │   │   │  1. Tension-type headache (G44.20)  [AI Suggested]              │  │    │    │
│  │   │   │  2. Hypertension, essential (I10)                                │  │    │    │
│  │   │   └──────────────────────────────────────────────────────────────────┘  │    │    │
│  │   │                                                                          │    │    │
│  │   │   ┌──────────────────────────────────────────────────────────────────┐  │    │    │
│  │   │   │  PLAN                                                             │  │    │    │
│  │   │   │  ─────────────────────────────────────────────────────────────── │  │    │    │
│  │   │   │  1. Trial of OTC acetaminophen PRN                               │  │    │    │
│  │   │   │  2. Headache diary for pattern identification                    │  │    │    │
│  │   │   │  3. Follow-up in 2 weeks                                         │  │    │    │
│  │   │   │  4. If no improvement, consider neuroimaging                     │  │    │    │
│  │   │   └──────────────────────────────────────────────────────────────────┘  │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          SPECIALTY TEMPLATES                                     │    │
│  │                                                                                  │    │
│  │   ┌──────────────┬──────────────┬──────────────┬──────────────┐                │    │
│  │   │    Dental    │     PT       │    Chiro     │ Urgent Care  │                │    │
│  │   ├──────────────┼──────────────┼──────────────┼──────────────┤                │    │
│  │   │• Perio exam  │• Eval        │• Subluxation │• Chief cmpt  │                │    │
│  │   │• Hard tissue │• ROM         │• Adjustment  │• Vitals      │                │    │
│  │   │• Soft tissue │• Strength    │• Pain scale  │• Exam        │                │    │
│  │   │• Radiographs │• Gait        │• X-ray       │• Diagnosis   │                │    │
│  │   │• Treatment   │• Goals       │• Treatment   │• Treatment   │                │    │
│  │   └──────────────┴──────────────┴──────────────┴──────────────┘                │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Billing & Claims Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          BILLING & CLAIMS ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          CLAIMS LIFECYCLE                                        │    │
│  │                                                                                  │    │
│  │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │    │
│  │   │  Charge  │───►│   Code   │───►│  Submit  │───►│   Track  │───►│  Post    │ │    │
│  │   │ Capture  │    │  Review  │    │  Claim   │    │  Status  │    │ Payment  │ │    │
│  │   └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘ │    │
│  │        │              │               │               │               │         │    │
│  │        ▼              ▼               ▼               ▼               ▼         │    │
│  │   Encounter      AI Coding       Clearinghouse    ERA/EOB         Ledger       │    │
│  │   Complete       Assist          (837P/837I)      Processing      Update       │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          CLAIM SUBMISSION FLOW                                   │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                                                                          │    │    │
│  │   │   Practice                                                              │    │    │
│  │   │   System        Clearinghouse         Payer                             │    │    │
│  │   │      │               │                  │                               │    │    │
│  │   │      │    837P       │                  │                               │    │    │
│  │   │      ├──────────────►│    EDI Claim     │                               │    │    │
│  │   │      │               ├─────────────────►│                               │    │    │
│  │   │      │               │                  │                               │    │    │
│  │   │      │    277CA      │                  │   Adjudication                │    │    │
│  │   │      │◄──────────────┤    277CA         │                               │    │    │
│  │   │      │ (Acknowledge) │◄─────────────────┤                               │    │    │
│  │   │      │               │                  │                               │    │    │
│  │   │      │               │                  │   835 (ERA)                   │    │    │
│  │   │      │    835        │    835           │                               │    │    │
│  │   │      │◄──────────────┤◄─────────────────┤                               │    │    │
│  │   │      │  (Payment)    │   (Payment)      │                               │    │    │
│  │   │      │               │                  │                               │    │    │
│  │   │      ▼               │                  │                               │    │    │
│  │   │   Auto-post                                                             │    │    │
│  │   │   to Ledger                                                             │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          ELIGIBILITY VERIFICATION                                │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                                                                          │    │    │
│  │   │   Input:                        270/271 Transaction                     │    │    │
│  │   │   ├── Patient demographics      ──────────────────►                     │    │    │
│  │   │   ├── Payer ID                                                          │    │    │
│  │   │   ├── Member ID                 ◄──────────────────                     │    │    │
│  │   │   └── Date of service                                                   │    │    │
│  │   │                                                                          │    │    │
│  │   │   Output:                                                               │    │    │
│  │   │   ┌──────────────────────────────────────────────────────────────────┐ │    │    │
│  │   │   │  Eligibility Response                                             │ │    │    │
│  │   │   │  ────────────────────────────────────────────────────────────── │ │    │    │
│  │   │   │  Status: ACTIVE ✓                                                 │ │    │    │
│  │   │   │  Plan: Blue Cross PPO                                             │ │    │    │
│  │   │   │  Effective: 01/01/2024                                            │ │    │    │
│  │   │   │                                                                    │ │    │    │
│  │   │   │  Benefits:                                                        │ │    │    │
│  │   │   │  • Copay (Office Visit): $25                                      │ │    │    │
│  │   │   │  • Deductible: $500 (Met: $350, Remaining: $150)                  │ │    │    │
│  │   │   │  • Coinsurance: 80/20 after deductible                            │ │    │    │
│  │   │   │  • Out-of-Pocket Max: $3,000 (Met: $450)                          │ │    │    │
│  │   │   │                                                                    │ │    │    │
│  │   │   └──────────────────────────────────────────────────────────────────┘ │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          DENIAL MANAGEMENT                                       │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                                                                          │    │    │
│  │   │   Denial Received (835/ERA)                                             │    │    │
│  │   │          │                                                               │    │    │
│  │   │          ▼                                                               │    │    │
│  │   │   ┌──────────────┐                                                      │    │    │
│  │   │   │   AI Denial  │                                                      │    │    │
│  │   │   │   Analyzer   │                                                      │    │    │
│  │   │   └──────┬───────┘                                                      │    │    │
│  │   │          │                                                               │    │    │
│  │   │          ▼                                                               │    │    │
│  │   │   ┌─────────────────────────────────────────────────────────────────┐   │    │    │
│  │   │   │  Denial Reason: CO-4 (Modifier required)                         │   │    │    │
│  │   │   │                                                                   │   │    │    │
│  │   │   │  AI Recommendation:                                              │   │    │    │
│  │   │   │  • Add modifier 25 to E/M code 99214                             │   │    │    │
│  │   │   │  • Resubmit with corrected claim                                 │   │    │    │
│  │   │   │                                                                   │   │    │    │
│  │   │   │  [Auto-Correct & Resubmit]  [Manual Review]  [Write Off]         │   │    │    │
│  │   │   │                                                                   │   │    │    │
│  │   │   └─────────────────────────────────────────────────────────────────┘   │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          HEALTHCARE INTEGRATION ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          INTEGRATION HUB                                         │    │
│  │                                                                                  │    │
│  │                        ┌────────────────────┐                                   │    │
│  │                        │  Integration       │                                   │    │
│  │                        │  Engine            │                                   │    │
│  │                        └─────────┬──────────┘                                   │    │
│  │                                  │                                               │    │
│  │   ┌────────────┬─────────────────┼─────────────────┬────────────┐               │    │
│  │   │            │                 │                 │            │               │    │
│  │   ▼            ▼                 ▼                 ▼            ▼               │    │
│  │ ┌──────┐   ┌──────┐         ┌──────┐         ┌──────┐    ┌──────┐              │    │
│  │ │ EHR  │   │ Labs │         │Claims│         │Pharmacy   │Imaging│              │    │
│  │ │(HL7) │   │(HL7) │         │(X12) │         │(NCPDP)│    │(DICOM)│              │    │
│  │ └──────┘   └──────┘         └──────┘         └──────┘    └──────┘              │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          CLEARINGHOUSE INTEGRATION                               │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                                                                          │    │    │
│  │   │   Supported Clearinghouses:                                             │    │    │
│  │   │   ├── Change Healthcare                                                 │    │    │
│  │   │   ├── Availity                                                          │    │    │
│  │   │   ├── Trizetto                                                          │    │    │
│  │   │   └── Office Ally                                                       │    │    │
│  │   │                                                                          │    │    │
│  │   │   Transactions:                                                         │    │    │
│  │   │   ├── 270/271 - Eligibility                                             │    │    │
│  │   │   ├── 276/277 - Claim Status                                            │    │    │
│  │   │   ├── 837P/837I - Claims                                                │    │    │
│  │   │   └── 835 - Remittance                                                  │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          LAB INTEGRATION (HL7)                                   │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                                                                          │    │    │
│  │   │   Outbound (Orders):                                                    │    │    │
│  │   │   Practice ──[ORM^O01]──► Lab                                           │    │    │
│  │   │                                                                          │    │    │
│  │   │   Inbound (Results):                                                    │    │    │
│  │   │   Lab ──[ORU^R01]──► Practice                                           │    │    │
│  │   │         │                                                                │    │    │
│  │   │         ▼                                                                │    │    │
│  │   │   ┌──────────────────────────────────────────────────────────────────┐  │    │    │
│  │   │   │  Auto-parsed to structured data                                   │  │    │    │
│  │   │   │  ├── Patient matched to record                                    │  │    │    │
│  │   │   │  ├── Results stored with LOINC codes                              │  │    │    │
│  │   │   │  ├── Abnormal values flagged                                      │  │    │    │
│  │   │   │  └── Provider notified for review                                 │  │    │    │
│  │   │   └──────────────────────────────────────────────────────────────────┘  │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          FHIR API (Future EHR Interop)                           │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                                                                          │    │    │
│  │   │   FHIR R4 Resources:                                                    │    │    │
│  │   │   ├── Patient                                                           │    │    │
│  │   │   ├── Encounter                                                         │    │    │
│  │   │   ├── Observation                                                       │    │    │
│  │   │   ├── Condition                                                         │    │    │
│  │   │   ├── Procedure                                                         │    │    │
│  │   │   ├── MedicationRequest                                                 │    │    │
│  │   │   └── DocumentReference                                                 │    │    │
│  │   │                                                                          │    │    │
│  │   │   Use Cases:                                                            │    │    │
│  │   │   • Patient data exchange with EHRs                                     │    │    │
│  │   │   • Clinical data sharing                                               │    │    │
│  │   │   • Patient access API (21st Century Cures)                             │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                       HIPAA-COMPLIANT DEPLOYMENT ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          AWS HIPAA-ELIGIBLE SERVICES                             │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                         VPC (Private)                                    │    │    │
│  │   │                                                                          │    │    │
│  │   │   ┌──────────────────────────────────────────────────────────────────┐  │    │    │
│  │   │   │  Private Subnet                                                   │  │    │    │
│  │   │   │  ┌────────────┐  ┌────────────┐  ┌────────────┐                  │  │    │    │
│  │   │   │  │    RDS     │  │ElastiCache │  │   Lambda   │                  │  │    │    │
│  │   │   │  │ PostgreSQL │  │   Redis    │  │ Functions  │                  │  │    │    │
│  │   │   │  │  (PHI DB)  │  │ (No PHI)   │  │            │                  │  │    │    │
│  │   │   │  └────────────┘  └────────────┘  └────────────┘                  │  │    │    │
│  │   │   └──────────────────────────────────────────────────────────────────┘  │    │    │
│  │   │                                                                          │    │    │
│  │   │   ┌──────────────────────────────────────────────────────────────────┐  │    │    │
│  │   │   │  Public Subnet                                                    │  │    │    │
│  │   │   │  ┌────────────┐  ┌────────────┐                                  │  │    │    │
│  │   │   │  │    NAT     │  │    ALB     │                                  │  │    │    │
│  │   │   │  │   Gateway  │  │            │                                  │  │    │    │
│  │   │   │  └────────────┘  └────────────┘                                  │  │    │    │
│  │   │   └──────────────────────────────────────────────────────────────────┘  │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  │   External Services (with BAA):                                                 │    │
│  │   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐              │    │
│  │   │   S3       │  │    SES     │  │   KMS      │  │ CloudTrail │              │    │
│  │   │(Documents) │  │  (Email)   │  │(Encryption)│  │  (Audit)   │              │    │
│  │   └────────────┘  └────────────┘  └────────────┘  └────────────┘              │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          MULTI-REGION DR                                         │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                                                                          │    │    │
│  │   │   Primary: us-east-1                 Secondary: us-west-2               │    │    │
│  │   │   ┌──────────────────┐              ┌──────────────────┐                │    │    │
│  │   │   │                  │              │                  │                │    │    │
│  │   │   │   RDS Primary    │──Replicate──►│   RDS Replica    │                │    │    │
│  │   │   │                  │              │                  │                │    │    │
│  │   │   │   S3 Primary     │──Replicate──►│   S3 Replica     │                │    │    │
│  │   │   │                  │              │                  │                │    │    │
│  │   │   └──────────────────┘              └──────────────────┘                │    │    │
│  │   │                                                                          │    │    │
│  │   │   RPO: 1 hour                       RTO: 4 hours                        │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Security & Audit Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY & AUDIT ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          ROLE-BASED ACCESS                                       │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │  Role               PHI Access                Permissions              │    │    │
│  │   │  ─────────────────────────────────────────────────────────────────── │    │    │
│  │   │  Practice Owner     All patients              Full system access      │    │    │
│  │   │  Provider           Assigned patients         Clinical + Billing     │    │    │
│  │   │  Nurse              Assigned patients         Clinical (limited)     │    │    │
│  │   │  Front Desk         All patients (limited)    Scheduling + Check-in  │    │    │
│  │   │  Biller             All patients (billing)    Billing only           │    │    │
│  │   │  Patient            Own records only          Portal access          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          AUDIT LOG SYSTEM                                        │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                                                                          │    │    │
│  │   │   All PHI Access Logged:                                                │    │    │
│  │   │                                                                          │    │    │
│  │   │   {                                                                      │    │    │
│  │   │     "timestamp": "2024-01-15T14:30:00Z",                                │    │    │
│  │   │     "event_type": "patient.record.view",                                │    │    │
│  │   │     "user": {                                                           │    │    │
│  │   │       "id": "user-uuid",                                                │    │    │
│  │   │       "name": "Dr. Smith",                                              │    │    │
│  │   │       "role": "provider"                                                │    │    │
│  │   │     },                                                                   │    │    │
│  │   │     "patient": {                                                        │    │    │
│  │   │       "id": "patient-uuid",                                             │    │    │
│  │   │       "mrn": "12345"                                                    │    │    │
│  │   │     },                                                                   │    │    │
│  │   │     "access_reason": "treatment",                                       │    │    │
│  │   │     "ip_address": "192.168.1.1",                                        │    │    │
│  │   │     "device": "Chrome/Windows"                                          │    │    │
│  │   │   }                                                                      │    │    │
│  │   │                                                                          │    │    │
│  │   │   Stored: CloudTrail → S3 (Object Lock) → 6 years retention            │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          BREACH DETECTION & RESPONSE                             │    │
│  │                                                                                  │    │
│  │   ┌────────────────────────────────────────────────────────────────────────┐    │    │
│  │   │                                                                          │    │    │
│  │   │   Anomaly Detection:                                                    │    │    │
│  │   │   ├── Unusual access patterns (off-hours, high volume)                  │    │    │
│  │   │   ├── Access to unrelated patients                                      │    │    │
│  │   │   ├── Bulk data exports                                                 │    │    │
│  │   │   ├── Failed login attempts                                             │    │    │
│  │   │   └── Geographic anomalies                                              │    │    │
│  │   │                                                                          │    │    │
│  │   │   Response:                                                             │    │    │
│  │   │   ├── Immediate alert to security officer                               │    │    │
│  │   │   ├── Automatic account lockout (if threshold exceeded)                 │    │    │
│  │   │   ├── Incident documentation                                            │    │    │
│  │   │   └── Breach notification process (if confirmed)                        │    │    │
│  │   │                                                                          │    │    │
│  │   └────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Summary

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14, React 18, React Native, FullCalendar |
| Backend | Node.js, Next.js API Routes, Prisma, HL7.js, FHIR.js |
| Database | PostgreSQL (RDS + KMS), Redis |
| Storage | AWS S3 (SSE-KMS), CloudTrail |
| AI | Claude (Medical), Deepgram, AWS Comprehend Medical |
| Claims | X12 837P/837I, 835, 270/271, Clearinghouse APIs |
| Compliance | HIPAA, AWS BAA, Full Audit Logging |

