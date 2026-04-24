# Healthcare Practice AI - Complete Implementation Prompt

## Project Overview

Build a complete, production-ready Healthcare Practice AI management system. This is a full-stack HIPAA-compliant web application for healthcare practices (dental, physical therapy, chiropractic, urgent care) that includes patient management, scheduling, clinical documentation, billing, insurance verification, claims processing, and AI-powered features like Medical Scribe and Billing Coder.

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API Routes, Prisma ORM 5.22.0
- **Database**: PostgreSQL (already running locally, no Docker)
- **Authentication**: NextAuth.js with credentials provider + 2FA support
- **AI**: OpenAI GPT-4 for Medical Scribe, Billing Coder, Denial Predictor
- **Voice**: Twilio for voice receptionist, Deepgram for speech-to-text
- **Payments**: Stripe for patient payments
- **Email/SMS**: Twilio for SMS, Nodemailer for email
- **File Storage**: Local filesystem (encrypted) or AWS S3 with encryption

## HIPAA Compliance Requirements

1. **Encryption**: AES-256 for data at rest, TLS 1.3 for data in transit
2. **Audit Logging**: All PHI access must be logged
3. **Access Controls**: Role-based with minimum necessary access
4. **Session Management**: Auto-logout after 15 minutes inactivity
5. **BAA Management**: Track all vendor agreements

## Project Structure

```
healthcare-practice-ai/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── setup-2fa/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx (Dashboard)
│   │   │   ├── patients/
│   │   │   │   ├── page.tsx (Patient List)
│   │   │   │   ├── [id]/page.tsx (Patient Chart)
│   │   │   │   └── new/page.tsx (New Patient)
│   │   │   ├── schedule/
│   │   │   │   ├── page.tsx (Schedule View)
│   │   │   │   ├── appointments/page.tsx
│   │   │   │   └── waitlist/page.tsx
│   │   │   ├── clinical/
│   │   │   │   ├── page.tsx (Today's Patients)
│   │   │   │   ├── encounter/[id]/page.tsx
│   │   │   │   └── templates/page.tsx
│   │   │   ├── billing/
│   │   │   │   ├── page.tsx (Billing Dashboard)
│   │   │   │   ├── claims/page.tsx
│   │   │   │   ├── payments/page.tsx
│   │   │   │   ├── aging/page.tsx
│   │   │   │   └── eligibility/page.tsx
│   │   │   ├── insurance/
│   │   │   │   ├── page.tsx (Insurance Management)
│   │   │   │   └── verification/page.tsx
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   ├── ai/
│   │   │   │   ├── scribe/page.tsx
│   │   │   │   ├── billing-coder/page.tsx
│   │   │   │   └── denial-predictor/page.tsx
│   │   │   ├── portal/
│   │   │   │   └── page.tsx (Patient Portal Admin)
│   │   │   └── settings/
│   │   │       ├── page.tsx
│   │   │       ├── providers/page.tsx
│   │   │       ├── locations/page.tsx
│   │   │       ├── services/page.tsx
│   │   │       ├── fee-schedules/page.tsx
│   │   │       └── hipaa/page.tsx
│   │   ├── portal/ (Patient Portal)
│   │   │   ├── page.tsx
│   │   │   ├── appointments/page.tsx
│   │   │   ├── messages/page.tsx
│   │   │   ├── records/page.tsx
│   │   │   └── payments/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── patients/route.ts
│   │   │   ├── patients/[id]/route.ts
│   │   │   ├── appointments/route.ts
│   │   │   ├── encounters/route.ts
│   │   │   ├── encounters/[id]/route.ts
│   │   │   ├── claims/route.ts
│   │   │   ├── eligibility/route.ts
│   │   │   ├── payments/route.ts
│   │   │   ├── insurance/route.ts
│   │   │   ├── providers/route.ts
│   │   │   ├── services/route.ts
│   │   │   ├── ai/
│   │   │   │   ├── scribe/route.ts
│   │   │   │   ├── billing-coder/route.ts
│   │   │   │   └── denial-predictor/route.ts
│   │   │   ├── audit/route.ts
│   │   │   └── reports/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── SessionTimeout.tsx
│   │   ├── patients/
│   │   │   ├── PatientCard.tsx
│   │   │   ├── PatientForm.tsx
│   │   │   ├── PatientTable.tsx
│   │   │   ├── PatientChart.tsx
│   │   │   ├── InsuranceCard.tsx
│   │   │   └── MedicalHistory.tsx
│   │   ├── schedule/
│   │   │   ├── CalendarView.tsx
│   │   │   ├── AppointmentForm.tsx
│   │   │   ├── AppointmentCard.tsx
│   │   │   └── WaitlistQueue.tsx
│   │   ├── clinical/
│   │   │   ├── EncounterForm.tsx
│   │   │   ├── SOAPNoteEditor.tsx
│   │   │   ├── VitalSigns.tsx
│   │   │   ├── DiagnosisSelector.tsx
│   │   │   ├── ProcedureSelector.tsx
│   │   │   └── TreatmentPlan.tsx
│   │   ├── billing/
│   │   │   ├── ClaimForm.tsx
│   │   │   ├── ClaimTable.tsx
│   │   │   ├── PaymentForm.tsx
│   │   │   ├── EligibilityChecker.tsx
│   │   │   └── AgingReport.tsx
│   │   └── ai/
│   │       ├── MedicalScribe.tsx
│   │       ├── BillingCoder.tsx
│   │       └── DenialPredictor.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── encryption.ts
│   │   ├── audit.ts
│   │   ├── hipaa.ts
│   │   ├── ai.ts
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── public/
├── uploads/ (encrypted)
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── start.sh
```

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============ PRACTICE & USERS ============

model Practice {
  id            String    @id @default(cuid())
  name          String
  npi           String?   // National Provider Identifier
  taxId         String?   // Encrypted
  specialty     Specialty
  phone         String?
  fax           String?
  email         String?
  website       String?
  logo          String?
  timezone      String    @default("America/New_York")

  // Address
  address       String?
  city          String?
  state         String?
  zip           String?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  locations     Location[]
  users         User[]
  providers     Provider[]
  patients      Patient[]
  services      Service[]
  feeSchedules  FeeSchedule[]
  insurancePlans InsurancePlan[]
  baaAgreements BAAgreement[]
}

enum Specialty {
  DENTAL
  PHYSICAL_THERAPY
  CHIROPRACTIC
  URGENT_CARE
  PRIMARY_CARE
  DERMATOLOGY
  ORTHOPEDIC
  OTHER
}

model Location {
  id            String    @id @default(cuid())
  name          String
  address       String
  city          String
  state         String
  zip           String
  phone         String?
  fax           String?
  email         String?
  isActive      Boolean   @default(true)

  // Operating hours (JSON)
  operatingHours Json?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  practice      Practice  @relation(fields: [practiceId], references: [id])
  practiceId    String
  appointments  Appointment[]
  providers     ProviderLocation[]
  rooms         Room[]
}

model Room {
  id            String    @id @default(cuid())
  name          String
  type          String    // Exam, Treatment, Surgery, etc.
  capacity      Int       @default(1)
  equipment     String[]
  isActive      Boolean   @default(true)

  location      Location  @relation(fields: [locationId], references: [id])
  locationId    String
  appointments  Appointment[]
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  firstName     String
  lastName      String
  role          UserRole
  phone         String?
  avatar        String?
  isActive      Boolean   @default(true)

  // 2FA
  twoFactorEnabled Boolean @default(false)
  twoFactorSecret String?

  // Session management
  lastLogin     DateTime?
  lastActivity  DateTime?
  failedLogins  Int       @default(0)
  lockedUntil   DateTime?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  practice      Practice  @relation(fields: [practiceId], references: [id])
  practiceId    String
  provider      Provider?
  auditLogs     AuditLog[]
}

enum UserRole {
  ADMIN
  PROVIDER
  NURSE
  RECEPTIONIST
  BILLER
  MANAGER
}

model Provider {
  id            String    @id @default(cuid())
  npi           String?
  licenseNumber String?
  licenseState  String?
  specialty     String
  title         String?   // MD, DO, DDS, PT, DC, etc.
  color         String?   // For calendar

  // Credentials
  credentials   String[]  // MD, FACP, etc.

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User      @relation(fields: [userId], references: [id])
  userId        String    @unique
  locations     ProviderLocation[]
  schedules     ProviderSchedule[]
  appointments  Appointment[]
  encounters    Encounter[]
  claims        Claim[]
}

model ProviderLocation {
  id          String   @id @default(cuid())

  provider    Provider @relation(fields: [providerId], references: [id])
  providerId  String
  location    Location @relation(fields: [locationId], references: [id])
  locationId  String

  @@unique([providerId, locationId])
}

model ProviderSchedule {
  id            String    @id @default(cuid())
  dayOfWeek     Int       // 0-6 (Sunday-Saturday)
  startTime     String    // HH:MM format
  endTime       String
  slotDuration  Int       @default(30) // minutes
  isAvailable   Boolean   @default(true)

  provider      Provider  @relation(fields: [providerId], references: [id])
  providerId    String

  @@unique([providerId, dayOfWeek])
}

// ============ PATIENTS ============

model Patient {
  id              String      @id @default(cuid())
  mrn             String      @unique // Medical Record Number
  status          PatientStatus @default(ACTIVE)

  // Demographics (PHI - encrypted at rest)
  firstName       String
  lastName        String
  middleName      String?
  dateOfBirth     DateTime
  gender          Gender
  ssn             String?     // Encrypted
  preferredName   String?
  pronouns        String?

  // Contact (PHI)
  email           String?
  phone           String?
  mobile          String?
  address         String?
  address2        String?
  city            String?
  state           String?
  zip             String?
  preferredContact String?    @default("phone")
  preferredLanguage String?   @default("en")

  // Emergency contact
  emergencyName   String?
  emergencyPhone  String?
  emergencyRelation String?

  // Employer
  employer        String?
  occupation      String?

  // Referral
  referralSource  String?
  referredBy      String?

  // Medical
  bloodType       String?
  height          Decimal?    @db.Decimal(5, 2) // inches
  weight          Decimal?    @db.Decimal(5, 2) // lbs

  // Portal access
  portalEnabled   Boolean     @default(false)
  portalEmail     String?
  portalPassword  String?

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Relations
  practice        Practice    @relation(fields: [practiceId], references: [id])
  practiceId      String
  insurances      PatientInsurance[]
  allergies       Allergy[]
  medications     Medication[]
  conditions      Condition[]
  familyHistory   FamilyHistory[]
  appointments    Appointment[]
  encounters      Encounter[]
  documents       PatientDocument[]
  claims          Claim[]
  payments        PatientPayment[]
  consents        PatientConsent[]
  communications  PatientCommunication[]
  balances        PatientBalance[]
  recalls         Recall[]
}

enum PatientStatus {
  ACTIVE
  INACTIVE
  DECEASED
  TRANSFERRED
}

enum Gender {
  MALE
  FEMALE
  OTHER
  UNKNOWN
}

model PatientInsurance {
  id              String      @id @default(cuid())
  priority        Int         // 1 = Primary, 2 = Secondary, etc.
  relationship    String      // Self, Spouse, Child, etc.

  // Subscriber info
  subscriberName  String
  subscriberId    String
  groupNumber     String?

  // Insurance
  insurancePlan   InsurancePlan @relation(fields: [insurancePlanId], references: [id])
  insurancePlanId String

  // Eligibility
  isVerified      Boolean     @default(false)
  verifiedDate    DateTime?
  eligibilityData Json?       // Cached eligibility response

  // Effective dates
  effectiveDate   DateTime?
  terminationDate DateTime?

  copay           Decimal?    @db.Decimal(10, 2)
  deductible      Decimal?    @db.Decimal(10, 2)
  deductibleMet   Decimal?    @db.Decimal(10, 2)

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  patient         Patient     @relation(fields: [patientId], references: [id])
  patientId       String
  claims          Claim[]

  @@unique([patientId, priority])
}

model Allergy {
  id            String      @id @default(cuid())
  allergen      String
  reaction      String?
  severity      Severity    @default(MODERATE)
  status        String      @default("active")
  onsetDate     DateTime?
  notes         String?

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  patient       Patient     @relation(fields: [patientId], references: [id])
  patientId     String
}

enum Severity {
  MILD
  MODERATE
  SEVERE
  LIFE_THREATENING
}

model Medication {
  id            String    @id @default(cuid())
  name          String
  dosage        String?
  frequency     String?
  route         String?   // Oral, IV, Topical, etc.
  prescribedBy  String?
  prescribedDate DateTime?
  startDate     DateTime?
  endDate       DateTime?
  status        String    @default("active")
  notes         String?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  patient       Patient   @relation(fields: [patientId], references: [id])
  patientId     String
}

model Condition {
  id            String    @id @default(cuid())
  icdCode       String?   // ICD-10 code
  name          String
  status        String    @default("active") // active, resolved, chronic
  onsetDate     DateTime?
  resolvedDate  DateTime?
  notes         String?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  patient       Patient   @relation(fields: [patientId], references: [id])
  patientId     String
}

model FamilyHistory {
  id            String    @id @default(cuid())
  relationship  String    // Mother, Father, Sibling, etc.
  condition     String
  ageAtOnset    Int?
  notes         String?

  patient       Patient   @relation(fields: [patientId], references: [id])
  patientId     String
}

model PatientConsent {
  id            String      @id @default(cuid())
  type          ConsentType
  status        String      @default("signed")
  signedDate    DateTime    @default(now())
  expiresDate   DateTime?
  signatureFile String?
  ipAddress     String?

  patient       Patient     @relation(fields: [patientId], references: [id])
  patientId     String
}

enum ConsentType {
  HIPAA_NOTICE
  TREATMENT_CONSENT
  FINANCIAL_RESPONSIBILITY
  TELEHEALTH_CONSENT
  RELEASE_OF_INFORMATION
  PHOTOGRAPHY_CONSENT
}

model PatientCommunication {
  id            String            @id @default(cuid())
  type          CommunicationType
  direction     String            // inbound, outbound
  subject       String?
  message       String
  status        String            @default("sent")
  sentAt        DateTime          @default(now())

  patient       Patient           @relation(fields: [patientId], references: [id])
  patientId     String
}

enum CommunicationType {
  EMAIL
  SMS
  PHONE
  PORTAL_MESSAGE
  LETTER
}

// ============ APPOINTMENTS ============

model Appointment {
  id              String            @id @default(cuid())
  type            AppointmentType   @relation(fields: [appointmentTypeId], references: [id])
  appointmentTypeId String
  status          AppointmentStatus @default(SCHEDULED)

  // Timing
  scheduledStart  DateTime
  scheduledEnd    DateTime
  actualStart     DateTime?
  actualEnd       DateTime?

  // Check-in
  checkedInAt     DateTime?
  checkedOutAt    DateTime?

  // Details
  chiefComplaint  String?
  notes           String?
  isNewPatient    Boolean           @default(false)
  isRecurring     Boolean           @default(false)
  recurrenceRule  String?           // RRULE format

  // Reminders
  reminderSent    Boolean           @default(false)
  confirmationSent Boolean          @default(false)
  confirmedAt     DateTime?

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  patient         Patient           @relation(fields: [patientId], references: [id])
  patientId       String
  provider        Provider          @relation(fields: [providerId], references: [id])
  providerId      String
  location        Location          @relation(fields: [locationId], references: [id])
  locationId      String
  room            Room?             @relation(fields: [roomId], references: [id])
  roomId          String?
  encounter       Encounter?
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  CHECKED_IN
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
  RESCHEDULED
}

model AppointmentType {
  id              String    @id @default(cuid())
  name            String
  code            String?
  duration        Int       // minutes
  color           String?
  description     String?
  isActive        Boolean   @default(true)

  // Prep and cleanup time
  prepTime        Int       @default(0)
  cleanupTime     Int       @default(0)

  // Online booking settings
  allowOnline     Boolean   @default(true)
  requireDeposit  Boolean   @default(false)
  depositAmount   Decimal?  @db.Decimal(10, 2)

  appointments    Appointment[]
  services        Service[]
}

model Recall {
  id            String      @id @default(cuid())
  type          String      // 6-month cleaning, annual exam, etc.
  dueDate       DateTime
  status        String      @default("pending") // pending, scheduled, completed
  notes         String?

  scheduledAt   DateTime?
  completedAt   DateTime?

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  patient       Patient     @relation(fields: [patientId], references: [id])
  patientId     String
}

// ============ CLINICAL ============

model Encounter {
  id              String          @id @default(cuid())
  encounterNumber String          @unique
  type            String          // Office Visit, Follow-up, Procedure, etc.
  status          EncounterStatus @default(IN_PROGRESS)

  encounterDate   DateTime        @default(now())

  // Vitals
  bloodPressureSystolic  Int?
  bloodPressureDiastolic Int?
  heartRate       Int?
  temperature     Decimal?        @db.Decimal(4, 1)
  respiratoryRate Int?
  oxygenSaturation Int?
  painLevel       Int?            // 0-10
  height          Decimal?        @db.Decimal(5, 2)
  weight          Decimal?        @db.Decimal(5, 2)

  // SOAP Note
  chiefComplaint  String?
  subjective      String?
  objective       String?
  assessment      String?
  plan            String?

  // Review of Systems
  reviewOfSystems Json?

  // Signatures
  signedBy        String?
  signedAt        DateTime?
  coSignedBy      String?
  coSignedAt      DateTime?

  // AI Scribe
  audioRecordingUrl String?
  transcription   String?
  aiDraftNote     String?

  notes           String?

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  // Relations
  appointment     Appointment?    @relation(fields: [appointmentId], references: [id])
  appointmentId   String?         @unique
  provider        Provider        @relation(fields: [providerId], references: [id])
  providerId      String
  diagnoses       EncounterDiagnosis[]
  procedures      EncounterProcedure[]
  orders          Order[]
  claims          Claim[]
}

enum EncounterStatus {
  IN_PROGRESS
  PENDING_REVIEW
  SIGNED
  LOCKED
  AMENDED
}

model EncounterDiagnosis {
  id            String    @id @default(cuid())
  sequence      Int       // 1 = Primary, 2+ = Secondary
  icdCode       String
  description   String
  notes         String?

  encounter     Encounter @relation(fields: [encounterId], references: [id])
  encounterId   String
}

model EncounterProcedure {
  id            String    @id @default(cuid())
  cptCode       String
  description   String
  quantity      Int       @default(1)
  modifiers     String[]
  toothNumber   String?   // For dental
  surface       String?   // For dental
  units         Decimal?  @db.Decimal(5, 2)
  notes         String?

  encounter     Encounter @relation(fields: [encounterId], references: [id])
  encounterId   String
  service       Service?  @relation(fields: [serviceId], references: [id])
  serviceId     String?
  claimLine     ClaimLine?
}

model Order {
  id            String      @id @default(cuid())
  type          OrderType
  status        String      @default("pending")
  priority      String      @default("routine")
  description   String
  instructions  String?

  orderedAt     DateTime    @default(now())
  completedAt   DateTime?

  encounter     Encounter   @relation(fields: [encounterId], references: [id])
  encounterId   String
}

enum OrderType {
  LAB
  IMAGING
  REFERRAL
  PRESCRIPTION
  DME
  OTHER
}

// ============ SERVICES & FEES ============

model Service {
  id              String    @id @default(cuid())
  code            String    // CPT/CDT code
  name            String
  description     String?
  category        String?
  duration        Int?      // minutes
  isActive        Boolean   @default(true)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  practice        Practice  @relation(fields: [practiceId], references: [id])
  practiceId      String
  appointmentTypes AppointmentType[]
  feeScheduleItems FeeScheduleItem[]
  procedures      EncounterProcedure[]

  @@unique([practiceId, code])
}

model FeeSchedule {
  id            String    @id @default(cuid())
  name          String
  effectiveDate DateTime
  expirationDate DateTime?
  isDefault     Boolean   @default(false)

  practice      Practice  @relation(fields: [practiceId], references: [id])
  practiceId    String
  items         FeeScheduleItem[]
}

model FeeScheduleItem {
  id            String    @id @default(cuid())
  fee           Decimal   @db.Decimal(10, 2)

  feeSchedule   FeeSchedule @relation(fields: [feeScheduleId], references: [id])
  feeScheduleId String
  service       Service   @relation(fields: [serviceId], references: [id])
  serviceId     String

  @@unique([feeScheduleId, serviceId])
}

// ============ INSURANCE ============

model InsurancePlan {
  id              String    @id @default(cuid())
  name            String
  payerId         String?   // Clearinghouse payer ID
  payerName       String
  planType        String?   // PPO, HMO, EPO, etc.
  phone           String?
  fax             String?
  address         String?
  city            String?
  state           String?
  zip             String?

  // Submission
  electronicPayerId String?
  submissionMethod String?  // Electronic, Paper

  isActive        Boolean   @default(true)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  practice        Practice  @relation(fields: [practiceId], references: [id])
  practiceId      String
  patientInsurances PatientInsurance[]
  claims          Claim[]
}

// ============ BILLING & CLAIMS ============

model Claim {
  id              String      @id @default(cuid())
  claimNumber     String      @unique
  status          ClaimStatus @default(CREATED)

  // Dates
  serviceDate     DateTime
  submittedDate   DateTime?
  processedDate   DateTime?

  // Amounts
  totalCharges    Decimal     @db.Decimal(10, 2)
  allowedAmount   Decimal?    @db.Decimal(10, 2)
  paidAmount      Decimal?    @db.Decimal(10, 2)
  adjustmentAmount Decimal?   @db.Decimal(10, 2)
  patientResponsibility Decimal? @db.Decimal(10, 2)

  // Claim info
  placeOfService  String?     // 11 = Office, 21 = Hospital, etc.

  // Clearinghouse
  clearinghouseId String?
  ediFileId       String?

  // ERA/EOB
  eraReceived     Boolean     @default(false)
  eraDate         DateTime?

  // Denial info
  denialReason    String?
  denialCode      String?

  notes           String?

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Relations
  patient         Patient     @relation(fields: [patientId], references: [id])
  patientId       String
  provider        Provider    @relation(fields: [providerId], references: [id])
  providerId      String
  encounter       Encounter?  @relation(fields: [encounterId], references: [id])
  encounterId     String?
  insurance       PatientInsurance @relation(fields: [insuranceId], references: [id])
  insuranceId     String
  insurancePlan   InsurancePlan @relation(fields: [insurancePlanId], references: [id])
  insurancePlanId String
  lines           ClaimLine[]
  payments        ClaimPayment[]
}

enum ClaimStatus {
  CREATED
  VALIDATED
  SUBMITTED
  ACKNOWLEDGED
  PENDING
  PAID
  PARTIAL
  DENIED
  APPEALED
  VOID
}

model ClaimLine {
  id              String    @id @default(cuid())
  lineNumber      Int
  cptCode         String
  description     String
  quantity        Int       @default(1)
  modifiers       String[]
  units           Decimal   @db.Decimal(5, 2) @default(1)

  // Diagnosis pointers
  diagnosisPointers Int[]   // References to claim diagnosis order

  chargeAmount    Decimal   @db.Decimal(10, 2)
  allowedAmount   Decimal?  @db.Decimal(10, 2)
  paidAmount      Decimal?  @db.Decimal(10, 2)
  adjustmentAmount Decimal? @db.Decimal(10, 2)

  // Denial
  denialReason    String?
  remarkCodes     String[]

  claim           Claim     @relation(fields: [claimId], references: [id])
  claimId         String
  procedure       EncounterProcedure? @relation(fields: [procedureId], references: [id])
  procedureId     String?             @unique
}

model ClaimPayment {
  id            String    @id @default(cuid())
  paymentDate   DateTime
  checkNumber   String?
  amount        Decimal   @db.Decimal(10, 2)
  payerType     String    // Insurance, Patient
  reference     String?

  createdAt     DateTime  @default(now())

  claim         Claim     @relation(fields: [claimId], references: [id])
  claimId       String
}

model PatientPayment {
  id            String        @id @default(cuid())
  amount        Decimal       @db.Decimal(10, 2)
  method        PaymentMethod
  reference     String?
  date          DateTime      @default(now())
  notes         String?

  patient       Patient       @relation(fields: [patientId], references: [id])
  patientId     String
}

enum PaymentMethod {
  CASH
  CHECK
  CREDIT_CARD
  DEBIT_CARD
  ACH
  OTHER
}

model PatientBalance {
  id            String    @id @default(cuid())
  totalCharges  Decimal   @db.Decimal(10, 2) @default(0)
  insurancePaid Decimal   @db.Decimal(10, 2) @default(0)
  patientPaid   Decimal   @db.Decimal(10, 2) @default(0)
  adjustments   Decimal   @db.Decimal(10, 2) @default(0)
  balance       Decimal   @db.Decimal(10, 2) @default(0)

  lastUpdated   DateTime  @updatedAt

  patient       Patient   @relation(fields: [patientId], references: [id])
  patientId     String    @unique
}

// ============ DOCUMENTS ============

model PatientDocument {
  id            String        @id @default(cuid())
  name          String
  type          DocumentType
  category      String?
  filePath      String        // Encrypted path
  fileSize      Int
  mimeType      String
  description   String?

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  patient       Patient       @relation(fields: [patientId], references: [id])
  patientId     String
}

enum DocumentType {
  INTAKE_FORM
  CONSENT
  INSURANCE_CARD
  ID
  LAB_RESULT
  IMAGING
  REFERRAL
  CORRESPONDENCE
  OTHER
}

// ============ HIPAA COMPLIANCE ============

model BAAgreement {
  id              String    @id @default(cuid())
  vendorName      String
  vendorType      String    // Cloud hosting, EHR, Clearinghouse, etc.
  effectiveDate   DateTime
  expirationDate  DateTime?
  documentPath    String?
  status          String    @default("active")
  contactName     String?
  contactEmail    String?
  notes           String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  practice        Practice  @relation(fields: [practiceId], references: [id])
  practiceId      String
}

model AuditLog {
  id            String    @id @default(cuid())
  action        String    // CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT
  entity        String    // Patient, Encounter, Claim, etc.
  entityId      String?
  patientId     String?   // Track PHI access specifically
  changes       Json?     // Before/after for updates
  ipAddress     String?
  userAgent     String?
  phiAccessed   Boolean   @default(false)

  createdAt     DateTime  @default(now())

  user          User      @relation(fields: [userId], references: [id])
  userId        String

  @@index([patientId])
  @@index([userId])
  @@index([createdAt])
}

// ============ ICD/CPT CODES ============

model ICD10Code {
  id            String    @id @default(cuid())
  code          String    @unique
  description   String
  category      String?
  isActive      Boolean   @default(true)
}

model CPTCode {
  id            String    @id @default(cuid())
  code          String    @unique
  description   String
  category      String?
  workRVU       Decimal?  @db.Decimal(5, 2)
  isActive      Boolean   @default(true)
}
```

## Seed Data (prisma/seed.ts)

Create comprehensive seed data including:

1. **Practice**: "Mountain View Medical Center"

2. **Locations** (2 locations):
   - Main Office - 123 Healthcare Ave
   - Satellite Clinic - 456 Wellness Blvd

3. **Users** (6 users):
   - Dr. James Wilson (Provider, Admin) - Specialty: Family Medicine
   - Dr. Lisa Chen (Provider) - Specialty: Internal Medicine
   - Sarah Thompson (Nurse)
   - Michael Rodriguez (Receptionist)
   - Jennifer Martinez (Biller)
   - Admin User (Manager)

4. **Providers** (2 providers):
   - Dr. James Wilson - NPI: 1234567890
   - Dr. Lisa Chen - NPI: 0987654321

5. **Appointment Types** (8 types):
   - New Patient (60 min, blue)
   - Follow-up (30 min, green)
   - Annual Physical (45 min, purple)
   - Sick Visit (20 min, red)
   - Procedure (45 min, orange)
   - Consultation (30 min, teal)
   - Telehealth (30 min, gray)
   - Urgent (15 min, red)

6. **Services/CPT Codes** (20 services):
   - 99213 - Office Visit Level 3 ($125)
   - 99214 - Office Visit Level 4 ($175)
   - 99215 - Office Visit Level 5 ($225)
   - 99203 - New Patient Level 3 ($175)
   - 99204 - New Patient Level 4 ($250)
   - 99396 - Annual Wellness 40-64 ($200)
   - ... etc with realistic fees

7. **Insurance Plans** (8 plans):
   - Aetna PPO
   - Blue Cross Blue Shield PPO
   - UnitedHealthcare HMO
   - Cigna PPO
   - Medicare
   - Medicaid
   - Humana
   - Self-Pay

8. **Patients** (20 patients):
   - Full demographics, addresses, contact info
   - Insurance information with subscriber details
   - Medical history (allergies, medications, conditions)
   - Various statuses

9. **Appointments** (30 appointments):
   - Next 2 weeks of appointments
   - Various providers and types
   - Mix of statuses

10. **Encounters** (15 encounters):
    - Complete SOAP notes
    - Vitals recorded
    - Diagnoses and procedures

11. **Claims** (20 claims):
    - Various statuses (submitted, paid, denied)
    - Realistic charge and payment amounts
    - Mix of insurance types

12. **ICD-10 Codes** (50 common codes):
    - J06.9 - Acute upper respiratory infection
    - M54.5 - Low back pain
    - E11.9 - Type 2 diabetes mellitus
    - I10 - Essential hypertension
    - ... etc

13. **CPT Codes** (50 common codes):
    - Office visits, procedures, lab codes

## API Endpoints

### Patients API (/api/patients)

```typescript
// GET /api/patients - List patients with search, pagination
// POST /api/patients - Create new patient
// GET /api/patients/[id] - Get patient chart (full PHI - logged)
// PUT /api/patients/[id] - Update patient
// POST /api/patients/[id]/insurance - Add insurance
// POST /api/patients/[id]/allergy - Add allergy
// POST /api/patients/[id]/medication - Add medication
// POST /api/patients/[id]/consent - Record consent
```

### Appointments API (/api/appointments)

```typescript
// GET /api/appointments - Get appointments by date range
// POST /api/appointments - Create appointment
// PUT /api/appointments/[id] - Update appointment
// POST /api/appointments/[id]/check-in - Check in patient
// POST /api/appointments/[id]/check-out - Check out patient
// DELETE /api/appointments/[id] - Cancel appointment
// GET /api/appointments/availability - Get available slots
```

### Encounters API (/api/encounters)

```typescript
// GET /api/encounters - List encounters
// POST /api/encounters - Create encounter from appointment
// GET /api/encounters/[id] - Get encounter details
// PUT /api/encounters/[id] - Update encounter
// POST /api/encounters/[id]/sign - Sign encounter
// POST /api/encounters/[id]/diagnosis - Add diagnosis
// POST /api/encounters/[id]/procedure - Add procedure
```

### Claims API (/api/claims)

```typescript
// GET /api/claims - List claims with filters
// POST /api/claims - Create claim from encounter
// GET /api/claims/[id] - Get claim details
// POST /api/claims/[id]/submit - Submit to clearinghouse
// POST /api/claims/[id]/payment - Record payment
// POST /api/claims/[id]/appeal - Create appeal
// GET /api/claims/aging - Get aging report
```

### Eligibility API (/api/eligibility)

```typescript
// POST /api/eligibility/verify - Verify insurance eligibility
// GET /api/eligibility/history - Get verification history
```

### AI APIs (/api/ai/*)

```typescript
// POST /api/ai/scribe/start - Start recording
// POST /api/ai/scribe/stop - Stop and process recording
// POST /api/ai/scribe/transcribe - Transcribe audio to SOAP note
// POST /api/ai/billing-coder - Suggest ICD/CPT codes from note
// POST /api/ai/denial-predictor - Predict denial risk for claim
```

### Audit API (/api/audit)

```typescript
// GET /api/audit - Get audit logs (admin only)
// GET /api/audit/patient/[id] - Get PHI access log for patient
// GET /api/audit/export - Export audit log
```

## UI Components

### Dashboard Page
- Today's schedule overview
- Patients checked in
- Revenue summary (today, week, month)
- Claims needing attention
- Recall list due
- Quick actions

### Patients Page
- Patient search with filters
- Patient list/cards view
- Click to open patient chart
- New patient button
- Import patients option

### Patient Chart Page
- Patient header with photo, demographics
- Tabs: Summary, Appointments, Encounters, Documents, Billing, Insurance
- Quick actions: Schedule, Check In, Create Encounter
- Allergy/medication alerts

### Schedule Page
- Calendar view (day/week/month)
- Provider filter
- Location filter
- Drag-and-drop rescheduling
- Click slot to create appointment
- Click appointment for details

### Encounter Page
- Patient info header
- Vitals entry form
- SOAP note editor (rich text)
- AI Scribe button (record audio)
- Diagnosis search and add
- Procedure search and add
- Orders section
- Sign encounter button

### Billing Dashboard
- Revenue metrics
- Claims by status
- Aging buckets (30/60/90/120)
- Recent payments
- Quick links to claim management

### Claims Page
- Claim list with status filters
- Click to view/edit claim
- Submit claim action
- Record payment modal
- Appeal workflow

### Eligibility Page
- Patient search
- Verify eligibility button
- Eligibility results display
- Benefits breakdown

### AI Scribe Page
- Record button (starts audio capture)
- Real-time transcription display
- Generate SOAP note button
- Edit generated note
- Save to encounter

### AI Billing Coder Page
- Paste or select encounter note
- Analyze button
- Suggested ICD-10 codes with confidence
- Suggested CPT codes with confidence
- Accept/reject suggestions
- Apply to encounter

### AI Denial Predictor Page
- Select claim or enter details
- Risk factors display
- Overall risk score
- Recommendations to reduce risk

## HIPAA Implementation

### Encryption Helper (lib/encryption.ts)
```typescript
// AES-256 encryption for PHI fields
// Key management
// Encrypt/decrypt functions
```

### Audit Logging (lib/audit.ts)
```typescript
// Log all PHI access
// Log all data changes
// Include user, IP, timestamp
// Tamper-proof storage
```

### Session Management
```typescript
// 15-minute inactivity timeout
// Session invalidation on logout
// Concurrent session limits
// Failed login lockout
```

## start.sh Script

```bash
#!/bin/bash

echo "Starting Healthcare Practice AI..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "Please update .env with your database credentials"
    exit 1
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Check if database is seeded
echo "Checking if database needs seeding..."
npx prisma db seed 2>/dev/null || echo "Database already seeded or seeding..."

# Start the development server
echo "Starting Next.js development server..."
npm run dev
```

## Environment Variables (.env.example)

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/healthcare_practice_ai"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Encryption key for PHI (32 bytes, base64 encoded)
ENCRYPTION_KEY="your-32-byte-key-base64-encoded"

# OpenAI (for AI features)
OPENAI_API_KEY="sk-..."

# Deepgram (for speech-to-text)
DEEPGRAM_API_KEY="..."

# Stripe (for patient payments)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Twilio (for SMS/Voice)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1..."

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# Clearinghouse (for claims)
CLEARINGHOUSE_API_URL="https://api.clearinghouse.com"
CLEARINGHOUSE_API_KEY="..."

# File uploads
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"
```

## Color Scheme

- Primary: Teal (#0D9488)
- Secondary: Slate (#64748B)
- Success: Green (#22C55E)
- Warning: Amber (#F59E0B)
- Error: Red (#EF4444)
- Background: White (#FFFFFF)
- Surface: Gray (#F8FAFC)
- Text: Slate (#0F172A)

Build this complete HIPAA-compliant healthcare application with all features working, comprehensive audit logging, encryption for PHI, and all UI components fully functional.
