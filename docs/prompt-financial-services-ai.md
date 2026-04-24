# Financial Services AI - Complete Implementation Prompt

## Project Overview

Build a complete, production-ready Financial Services AI practice management system. This is a full-stack web application for accounting firms, bookkeepers, and tax preparers that includes client management, workflow management, document exchange, tax organizer, bookkeeping features, time tracking, billing, and AI-powered features like Transaction Categorizer, Receipt Processor, and Tax Deduction Finder.

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API Routes, Prisma ORM 5.22.0
- **Database**: PostgreSQL (already running locally, no Docker)
- **Authentication**: NextAuth.js with credentials provider
- **AI**: OpenAI GPT-4 for transaction categorization, receipt processing, deduction finding
- **Bank Connections**: Plaid for bank account linking
- **Payments**: Stripe for client billing
- **Email**: Nodemailer for email communications
- **File Processing**: pdf-parse for document processing, Tesseract for OCR
- **Accounting Integration**: QuickBooks Online API, Xero API

## Project Structure

```
financial-services-ai/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx (Dashboard)
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx (Client List)
│   │   │   │   ├── [id]/page.tsx (Client Detail)
│   │   │   │   └── new/page.tsx (New Client)
│   │   │   ├── work/
│   │   │   │   ├── page.tsx (Work Dashboard)
│   │   │   │   ├── [id]/page.tsx (Work Item Detail)
│   │   │   │   └── templates/page.tsx
│   │   │   ├── documents/
│   │   │   │   ├── page.tsx (Document Library)
│   │   │   │   └── requests/page.tsx
│   │   │   ├── tax/
│   │   │   │   ├── page.tsx (Tax Returns Dashboard)
│   │   │   │   ├── organizer/[id]/page.tsx
│   │   │   │   └── returns/page.tsx
│   │   │   ├── bookkeeping/
│   │   │   │   ├── page.tsx (Bookkeeping Dashboard)
│   │   │   │   ├── transactions/page.tsx
│   │   │   │   ├── reconciliation/page.tsx
│   │   │   │   └── reports/page.tsx
│   │   │   ├── time-billing/
│   │   │   │   ├── page.tsx (Time Entries)
│   │   │   │   └── invoices/page.tsx
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   ├── ai/
│   │   │   │   ├── categorizer/page.tsx
│   │   │   │   ├── receipts/page.tsx
│   │   │   │   └── deductions/page.tsx
│   │   │   └── settings/
│   │   │       ├── page.tsx
│   │   │       ├── team/page.tsx
│   │   │       ├── templates/page.tsx
│   │   │       └── integrations/page.tsx
│   │   ├── portal/ (Client Portal)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx (Portal Dashboard)
│   │   │   ├── documents/page.tsx
│   │   │   ├── organizer/page.tsx
│   │   │   ├── messages/page.tsx
│   │   │   └── invoices/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── clients/route.ts
│   │   │   ├── clients/[id]/route.ts
│   │   │   ├── work/route.ts
│   │   │   ├── work/[id]/route.ts
│   │   │   ├── documents/route.ts
│   │   │   ├── document-requests/route.ts
│   │   │   ├── tax-organizers/route.ts
│   │   │   ├── tax-returns/route.ts
│   │   │   ├── bookkeeping/
│   │   │   │   ├── transactions/route.ts
│   │   │   │   ├── accounts/route.ts
│   │   │   │   └── reconciliation/route.ts
│   │   │   ├── bank-connections/route.ts
│   │   │   ├── time-entries/route.ts
│   │   │   ├── invoices/route.ts
│   │   │   ├── ai/
│   │   │   │   ├── categorize/route.ts
│   │   │   │   ├── process-receipt/route.ts
│   │   │   │   └── find-deductions/route.ts
│   │   │   ├── integrations/
│   │   │   │   ├── quickbooks/route.ts
│   │   │   │   ├── xero/route.ts
│   │   │   │   └── plaid/route.ts
│   │   │   └── reports/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── PortalLayout.tsx
│   │   ├── clients/
│   │   │   ├── ClientCard.tsx
│   │   │   ├── ClientForm.tsx
│   │   │   ├── ClientTable.tsx
│   │   │   └── EngagementLetter.tsx
│   │   ├── work/
│   │   │   ├── WorkBoard.tsx
│   │   │   ├── WorkItemCard.tsx
│   │   │   ├── WorkItemForm.tsx
│   │   │   ├── TaskChecklist.tsx
│   │   │   └── WorkflowTemplate.tsx
│   │   ├── documents/
│   │   │   ├── DocumentUploader.tsx
│   │   │   ├── DocumentList.tsx
│   │   │   ├── DocumentViewer.tsx
│   │   │   └── DocumentRequest.tsx
│   │   ├── tax/
│   │   │   ├── TaxOrganizer.tsx
│   │   │   ├── TaxReturnStatus.tsx
│   │   │   ├── DocumentChecklist.tsx
│   │   │   └── TaxSummary.tsx
│   │   ├── bookkeeping/
│   │   │   ├── TransactionList.tsx
│   │   │   ├── TransactionForm.tsx
│   │   │   ├── CategorySelector.tsx
│   │   │   ├── ReconciliationView.tsx
│   │   │   └── ChartOfAccounts.tsx
│   │   ├── billing/
│   │   │   ├── TimeEntryForm.tsx
│   │   │   ├── TimeEntryTable.tsx
│   │   │   ├── InvoiceGenerator.tsx
│   │   │   └── PaymentTracker.tsx
│   │   └── ai/
│   │       ├── TransactionCategorizer.tsx
│   │       ├── ReceiptProcessor.tsx
│   │       └── DeductionFinder.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── utils.ts
│   │   ├── ai.ts
│   │   ├── plaid.ts
│   │   ├── quickbooks.ts
│   │   ├── xero.ts
│   │   └── email.ts
│   └── types/
│       └── index.ts
├── public/
├── uploads/
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

// ============ FIRM & USERS ============

model Firm {
  id            String    @id @default(cuid())
  name          String
  phone         String?
  email         String?
  website       String?
  logo          String?
  timezone      String    @default("America/New_York")

  // Address
  address       String?
  city          String?
  state         String?
  zip           String?

  // Business info
  einNumber     String?   // Encrypted

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  users         User[]
  clients       Client[]
  workTemplates WorkTemplate[]
  accounts      Account[]
  documentCategories DocumentCategory[]
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
  title         String?
  hourlyRate    Decimal?  @db.Decimal(10, 2)
  isActive      Boolean   @default(true)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  firm          Firm      @relation(fields: [firmId], references: [id])
  firmId        String
  timeEntries   TimeEntry[]
  workItems     WorkItem[]
  assignedWork  WorkAssignment[]
  comments      Comment[]
}

enum UserRole {
  ADMIN
  PARTNER
  MANAGER
  ACCOUNTANT
  BOOKKEEPER
  STAFF
}

// ============ CLIENTS ============

model Client {
  id              String        @id @default(cuid())
  clientNumber    String        @unique
  type            ClientType    @default(INDIVIDUAL)
  status          ClientStatus  @default(ACTIVE)

  // Individual fields
  firstName       String?
  lastName        String?
  ssn             String?       // Encrypted

  // Business fields
  businessName    String?
  entityType      EntityType?
  ein             String?       // Encrypted
  stateId         String?
  fiscalYearEnd   Int?          // Month number (1-12)
  formationDate   DateTime?
  industry        String?

  // Contact
  email           String?
  phone           String?
  mobile          String?

  // Address
  address         String?
  address2        String?
  city            String?
  state           String?
  zip             String?

  // Billing
  billingEmail    String?
  paymentTerms    Int           @default(30)

  // Services
  services        String[]      // Tax, Bookkeeping, Payroll, etc.

  // Engagement
  engagementDate  DateTime?
  engagementLetter String?

  // Portal
  portalEnabled   Boolean       @default(false)
  portalEmail     String?
  portalPassword  String?

  notes           String?
  tags            String[]

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // Relations
  firm            Firm          @relation(fields: [firmId], references: [id])
  firmId          String
  contacts        ClientContact[]
  documents       Document[]
  workItems       WorkItem[]
  taxReturns      TaxReturn[]
  taxOrganizers   TaxOrganizer[]
  bankConnections BankConnection[]
  transactions    Transaction[]
  invoices        Invoice[]
  timeEntries     TimeEntry[]
  messages        Message[]
}

enum ClientType {
  INDIVIDUAL
  SOLE_PROPRIETOR
  PARTNERSHIP
  S_CORP
  C_CORP
  LLC
  NONPROFIT
  TRUST
  ESTATE
}

enum ClientStatus {
  ACTIVE
  INACTIVE
  PROSPECT
  ARCHIVED
}

enum EntityType {
  SOLE_PROPRIETORSHIP
  PARTNERSHIP
  S_CORPORATION
  C_CORPORATION
  LLC_SINGLE_MEMBER
  LLC_MULTI_MEMBER
  LLC_S_ELECTION
  NONPROFIT_501C3
  OTHER
}

model ClientContact {
  id            String    @id @default(cuid())
  type          String    // Primary, Spouse, Bookkeeper, etc.
  firstName     String
  lastName      String
  title         String?
  email         String?
  phone         String?
  isPrimary     Boolean   @default(false)
  canSign       Boolean   @default(false)
  notes         String?

  client        Client    @relation(fields: [clientId], references: [id])
  clientId      String
}

// ============ WORK MANAGEMENT ============

model WorkTemplate {
  id            String    @id @default(cuid())
  name          String
  code          String?
  description   String?
  type          WorkType
  defaultDueOffset Int?   // Days from trigger date

  // Template phases and tasks stored as JSON
  phases        Json      // Array of phases with tasks

  isActive      Boolean   @default(true)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  firm          Firm      @relation(fields: [firmId], references: [id])
  firmId        String
  workItems     WorkItem[]

  @@unique([firmId, name])
}

enum WorkType {
  TAX_RETURN_1040
  TAX_RETURN_1120
  TAX_RETURN_1120S
  TAX_RETURN_1065
  TAX_RETURN_990
  TAX_RETURN_OTHER
  BOOKKEEPING_MONTHLY
  BOOKKEEPING_QUARTERLY
  BOOKKEEPING_ANNUAL
  PAYROLL
  QUARTERLY_ESTIMATE
  YEAR_END_CLOSE
  FINANCIAL_STATEMENT
  AUDIT
  REVIEW
  COMPILATION
  ADVISORY
  OTHER
}

model WorkItem {
  id            String        @id @default(cuid())
  workNumber    String        @unique
  name          String
  description   String?
  status        WorkStatus    @default(NOT_STARTED)
  priority      Priority      @default(NORMAL)

  // Dates
  startDate     DateTime?
  dueDate       DateTime?
  completedDate DateTime?

  // Period
  taxYear       Int?
  periodStart   DateTime?
  periodEnd     DateTime?

  // Progress
  progress      Int           @default(0) // 0-100

  // Budget
  budgetHours   Decimal?      @db.Decimal(10, 2)
  actualHours   Decimal?      @db.Decimal(10, 2)

  notes         String?
  tags          String[]

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Relations
  client        Client        @relation(fields: [clientId], references: [id])
  clientId      String
  template      WorkTemplate? @relation(fields: [templateId], references: [id])
  templateId    String?
  createdBy     User          @relation(fields: [createdById], references: [id])
  createdById   String
  assignments   WorkAssignment[]
  tasks         WorkTask[]
  timeEntries   TimeEntry[]
  documents     Document[]
  comments      Comment[]
  taxReturn     TaxReturn?
}

enum WorkStatus {
  NOT_STARTED
  IN_PROGRESS
  WAITING_CLIENT
  IN_REVIEW
  COMPLETED
  ON_HOLD
  CANCELLED
}

enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}

model WorkAssignment {
  id            String    @id @default(cuid())
  role          String?   // Preparer, Reviewer, etc.
  assignedAt    DateTime  @default(now())

  workItem      WorkItem  @relation(fields: [workItemId], references: [id])
  workItemId    String
  user          User      @relation(fields: [userId], references: [id])
  userId        String

  @@unique([workItemId, userId])
}

model WorkTask {
  id            String      @id @default(cuid())
  name          String
  description   String?
  phase         String?
  status        TaskStatus  @default(TODO)
  dueDate       DateTime?
  completedAt   DateTime?
  sortOrder     Int         @default(0)

  // Checklist items (JSON array)
  checklist     Json?

  workItem      WorkItem    @relation(fields: [workItemId], references: [id])
  workItemId    String
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  COMPLETED
  SKIPPED
}

model Comment {
  id            String    @id @default(cuid())
  content       String
  isInternal    Boolean   @default(true)
  createdAt     DateTime  @default(now())

  workItem      WorkItem  @relation(fields: [workItemId], references: [id])
  workItemId    String
  user          User      @relation(fields: [userId], references: [id])
  userId        String
}

// ============ DOCUMENTS ============

model DocumentCategory {
  id            String    @id @default(cuid())
  name          String
  description   String?
  sortOrder     Int       @default(0)

  firm          Firm      @relation(fields: [firmId], references: [id])
  firmId        String
  documents     Document[]

  @@unique([firmId, name])
}

model Document {
  id            String          @id @default(cuid())
  name          String
  description   String?
  filePath      String
  fileSize      Int
  mimeType      String

  // Classification
  type          DocumentType?
  year          Int?

  // OCR/AI processed data
  extractedData Json?
  isProcessed   Boolean         @default(false)

  // E-signature
  requiresSignature Boolean     @default(false)
  signedAt      DateTime?
  signatureFile String?

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  // Relations
  client        Client          @relation(fields: [clientId], references: [id])
  clientId      String
  category      DocumentCategory? @relation(fields: [categoryId], references: [id])
  categoryId    String?
  workItem      WorkItem?       @relation(fields: [workItemId], references: [id])
  workItemId    String?
  request       DocumentRequest? @relation(fields: [requestId], references: [id])
  requestId     String?
}

enum DocumentType {
  W2
  W9
  FORM_1099
  FORM_1098
  K1
  BANK_STATEMENT
  BROKERAGE_STATEMENT
  RECEIPT
  INVOICE
  CONTRACT
  TAX_RETURN
  FINANCIAL_STATEMENT
  ENGAGEMENT_LETTER
  CORRESPONDENCE
  ID_DOCUMENT
  OTHER
}

model DocumentRequest {
  id            String    @id @default(cuid())
  title         String
  description   String?
  dueDate       DateTime?
  status        RequestStatus @default(PENDING)

  // Items requested
  items         Json      // Array of requested items

  sentAt        DateTime?
  completedAt   DateTime?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  client        Client    @relation(fields: [clientId], references: [id])
  clientId      String
  documents     Document[]
}

enum RequestStatus {
  DRAFT
  PENDING
  PARTIAL
  COMPLETED
  CANCELLED
}

// ============ TAX ============

model TaxReturn {
  id            String        @id @default(cuid())
  taxYear       Int
  formType      String        // 1040, 1120, 1065, etc.
  status        TaxReturnStatus @default(NOT_STARTED)

  // Filing
  filingStatus  String?       // Single, MFJ, MFS, HOH, QW (for 1040)
  filingDeadline DateTime?
  extendedDeadline DateTime?
  filedDate     DateTime?
  acceptedDate  DateTime?

  // Extension
  extensionFiled Boolean      @default(false)
  extensionDate DateTime?

  // Estimates
  federalEstimate Decimal?    @db.Decimal(12, 2)
  stateEstimate Decimal?      @db.Decimal(12, 2)
  estimatesPaid Decimal?      @db.Decimal(12, 2)

  // Results
  federalRefund Decimal?      @db.Decimal(12, 2)
  federalOwed   Decimal?      @db.Decimal(12, 2)
  stateRefund   Decimal?      @db.Decimal(12, 2)
  stateOwed     Decimal?      @db.Decimal(12, 2)

  // E-file
  efileStatus   String?
  efileDate     DateTime?
  confirmationNumber String?

  notes         String?

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  client        Client        @relation(fields: [clientId], references: [id])
  clientId      String
  workItem      WorkItem?     @relation(fields: [workItemId], references: [id])
  workItemId    String?       @unique
  organizer     TaxOrganizer?

  @@unique([clientId, taxYear, formType])
}

enum TaxReturnStatus {
  NOT_STARTED
  GATHERING_DOCS
  IN_PREPARATION
  IN_REVIEW
  PENDING_CLIENT
  READY_TO_FILE
  FILED
  ACCEPTED
  REJECTED
}

model TaxOrganizer {
  id            String    @id @default(cuid())
  taxYear       Int
  status        OrganizerStatus @default(NOT_STARTED)

  // Questionnaire responses (JSON)
  responses     Json?

  // Document checklist status
  checklistStatus Json?

  // Progress tracking
  progress      Int       @default(0) // 0-100

  sentAt        DateTime?
  startedAt     DateTime?
  completedAt   DateTime?

  // Reminders
  reminderCount Int       @default(0)
  lastReminder  DateTime?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  client        Client    @relation(fields: [clientId], references: [id])
  clientId      String
  taxReturn     TaxReturn? @relation(fields: [taxReturnId], references: [id])
  taxReturnId   String?   @unique

  @@unique([clientId, taxYear])
}

enum OrganizerStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  NOT_APPLICABLE
}

// ============ BOOKKEEPING ============

model BankConnection {
  id            String    @id @default(cuid())
  institutionId String
  institutionName String
  accountMask   String    // Last 4 digits
  accountName   String?
  accountType   String    // Checking, Savings, Credit
  plaidAccessToken String? // Encrypted
  plaidItemId   String?

  lastSyncDate  DateTime?
  syncStatus    String    @default("active")

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  client        Client    @relation(fields: [clientId], references: [id])
  clientId      String
  transactions  Transaction[]
}

model Account {
  id            String      @id @default(cuid())
  accountNumber String
  name          String
  type          AccountType
  subType       String?
  description   String?
  taxLine       String?     // Maps to tax form line
  isActive      Boolean     @default(true)

  // Balance
  balance       Decimal     @db.Decimal(12, 2) @default(0)

  // Parent for hierarchy
  parentId      String?
  parent        Account?    @relation("AccountHierarchy", fields: [parentId], references: [id])
  children      Account[]   @relation("AccountHierarchy")

  firm          Firm        @relation(fields: [firmId], references: [id])
  firmId        String
  transactionLines TransactionLine[]

  @@unique([firmId, accountNumber])
}

enum AccountType {
  ASSET
  LIABILITY
  EQUITY
  REVENUE
  COST_OF_GOODS_SOLD
  EXPENSE
  OTHER_INCOME
  OTHER_EXPENSE
}

model Transaction {
  id            String            @id @default(cuid())
  date          DateTime
  description   String
  amount        Decimal           @db.Decimal(12, 2)
  type          TransactionType
  status        TransactionStatus @default(PENDING)

  // Original bank data
  bankDescription String?
  bankCategory  String?
  bankTransactionId String?

  // AI categorization
  aiCategorized Boolean     @default(false)
  aiConfidence  Decimal?    @db.Decimal(5, 2)
  aiSuggestions Json?

  // Reconciliation
  isReconciled  Boolean     @default(false)
  reconciledAt  DateTime?

  // Receipt/attachment
  receiptPath   String?
  receiptData   Json?       // OCR extracted data

  notes         String?

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  client        Client      @relation(fields: [clientId], references: [id])
  clientId      String
  bankConnection BankConnection? @relation(fields: [bankConnectionId], references: [id])
  bankConnectionId String?
  lines         TransactionLine[]
}

enum TransactionType {
  INCOME
  EXPENSE
  TRANSFER
  JOURNAL
}

enum TransactionStatus {
  PENDING
  CATEGORIZED
  REVIEWED
  RECONCILED
}

model TransactionLine {
  id            String    @id @default(cuid())
  description   String?
  debit         Decimal?  @db.Decimal(12, 2)
  credit        Decimal?  @db.Decimal(12, 2)

  transaction   Transaction @relation(fields: [transactionId], references: [id])
  transactionId String
  account       Account   @relation(fields: [accountId], references: [id])
  accountId     String
}

model Reconciliation {
  id              String    @id @default(cuid())
  accountName     String
  statementDate   DateTime
  statementBalance Decimal  @db.Decimal(12, 2)
  reconciledBalance Decimal @db.Decimal(12, 2)
  difference      Decimal   @db.Decimal(12, 2)
  status          String    @default("in_progress")
  completedAt     DateTime?

  // Cleared items (JSON array of transaction IDs)
  clearedItems    Json?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  clientId        String
}

// ============ TIME & BILLING ============

model TimeEntry {
  id            String    @id @default(cuid())
  date          DateTime
  hours         Decimal   @db.Decimal(5, 2)
  rate          Decimal   @db.Decimal(10, 2)
  amount        Decimal   @db.Decimal(10, 2)
  description   String
  billable      Boolean   @default(true)
  billed        Boolean   @default(false)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  client        Client    @relation(fields: [clientId], references: [id])
  clientId      String
  user          User      @relation(fields: [userId], references: [id])
  userId        String
  workItem      WorkItem? @relation(fields: [workItemId], references: [id])
  workItemId    String?
  invoice       Invoice?  @relation(fields: [invoiceId], references: [id])
  invoiceId     String?
}

model Invoice {
  id            String        @id @default(cuid())
  invoiceNumber String        @unique
  status        InvoiceStatus @default(DRAFT)

  // Dates
  issueDate     DateTime      @default(now())
  dueDate       DateTime
  paidDate      DateTime?

  // Period
  periodStart   DateTime?
  periodEnd     DateTime?

  // Amounts
  subtotal      Decimal       @db.Decimal(10, 2)
  taxAmount     Decimal       @db.Decimal(10, 2) @default(0)
  totalAmount   Decimal       @db.Decimal(10, 2)
  paidAmount    Decimal       @db.Decimal(10, 2) @default(0)
  balanceDue    Decimal       @db.Decimal(10, 2)

  notes         String?
  terms         String?

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  client        Client        @relation(fields: [clientId], references: [id])
  clientId      String
  timeEntries   TimeEntry[]
  lineItems     InvoiceLineItem[]
  payments      Payment[]
}

enum InvoiceStatus {
  DRAFT
  SENT
  VIEWED
  PARTIAL
  PAID
  OVERDUE
  VOID
}

model InvoiceLineItem {
  id            String    @id @default(cuid())
  description   String
  quantity      Decimal   @db.Decimal(10, 2)
  rate          Decimal   @db.Decimal(10, 2)
  amount        Decimal   @db.Decimal(10, 2)
  sortOrder     Int       @default(0)

  invoice       Invoice   @relation(fields: [invoiceId], references: [id])
  invoiceId     String
}

model Payment {
  id            String        @id @default(cuid())
  amount        Decimal       @db.Decimal(10, 2)
  method        PaymentMethod
  reference     String?
  date          DateTime      @default(now())
  notes         String?

  stripePaymentId String?

  invoice       Invoice       @relation(fields: [invoiceId], references: [id])
  invoiceId     String
}

enum PaymentMethod {
  CHECK
  CREDIT_CARD
  ACH
  WIRE
  CASH
  OTHER
}

// ============ MESSAGING ============

model Message {
  id            String    @id @default(cuid())
  subject       String?
  content       String
  isRead        Boolean   @default(false)
  isFromClient  Boolean   @default(false)

  createdAt     DateTime  @default(now())

  client        Client    @relation(fields: [clientId], references: [id])
  clientId      String
}
```

## Seed Data (prisma/seed.ts)

Create comprehensive seed data including:

1. **Firm**: "Summit Accounting Group"

2. **Users** (5 users):
   - Robert Chen (Partner, Admin) - $350/hr
   - Amanda Foster (Manager) - $250/hr
   - David Kim (Senior Accountant) - $175/hr
   - Jennifer Lopez (Staff Accountant) - $125/hr
   - Mike Thompson (Bookkeeper) - $85/hr

3. **Document Categories** (8 categories):
   - Tax Documents
   - Financial Statements
   - Bank Statements
   - Receipts
   - Invoices
   - Contracts
   - Correspondence
   - Other

4. **Work Templates** (10 templates):
   - 1040 Individual Tax Return
   - 1120S S-Corporation Return
   - 1065 Partnership Return
   - 990 Nonprofit Return
   - Monthly Bookkeeping
   - Quarterly Review
   - Year-End Close
   - Payroll Processing
   - Financial Statement Compilation
   - Tax Planning Consultation

5. **Chart of Accounts** (50 accounts):
   - Standard accounts for businesses
   - Assets, Liabilities, Equity, Revenue, Expenses
   - Tax line mappings

6. **Clients** (20 clients):
   - Mix of individuals and businesses
   - Various entity types
   - Full contact info
   - Service types assigned

7. **Tax Returns** (30 returns):
   - Various tax years (2022, 2023, 2024)
   - Different form types
   - Various statuses

8. **Tax Organizers** (15 organizers):
   - Linked to tax returns
   - Various completion states
   - Sample questionnaire responses

9. **Work Items** (25 work items):
   - Various types and statuses
   - Assigned to team members
   - Tasks and progress

10. **Documents** (40 documents):
    - W-2s, 1099s, K-1s
    - Bank statements
    - Financial statements
    - Engagement letters

11. **Bank Connections** (10 connections):
    - Various banks
    - Sample account data

12. **Transactions** (200 transactions):
    - Last 6 months of data
    - Various categories
    - Some categorized, some pending

13. **Time Entries** (50 entries):
    - Last 3 months
    - Various clients and users

14. **Invoices** (15 invoices):
    - Various statuses
    - With payments

## API Endpoints

### Clients API (/api/clients)

```typescript
// GET /api/clients - List clients with search, pagination
// POST /api/clients - Create new client
// GET /api/clients/[id] - Get client with full details
// PUT /api/clients/[id] - Update client
// DELETE /api/clients/[id] - Archive client
// POST /api/clients/[id]/portal - Enable/update portal access
// GET /api/clients/[id]/summary - Get client summary data
```

### Work API (/api/work)

```typescript
// GET /api/work - List work items with filters
// POST /api/work - Create work item (optionally from template)
// GET /api/work/[id] - Get work item details
// PUT /api/work/[id] - Update work item
// POST /api/work/[id]/assign - Assign team members
// PUT /api/work/[id]/status - Update status
// POST /api/work/[id]/tasks - Add/update tasks
// GET /api/work/templates - Get work templates
// POST /api/work/templates - Create template
```

### Documents API (/api/documents)

```typescript
// GET /api/documents - List documents
// POST /api/documents - Upload document(s)
// GET /api/documents/[id] - Get document
// DELETE /api/documents/[id] - Delete document
// POST /api/documents/[id]/process - OCR/AI process document
// GET /api/document-requests - List requests
// POST /api/document-requests - Create request
// POST /api/document-requests/[id]/send - Send request to client
```

### Tax API (/api/tax-*)

```typescript
// GET /api/tax-returns - List tax returns
// POST /api/tax-returns - Create tax return
// PUT /api/tax-returns/[id] - Update tax return
// GET /api/tax-organizers - List organizers
// POST /api/tax-organizers - Create organizer
// PUT /api/tax-organizers/[id] - Update organizer
// POST /api/tax-organizers/[id]/send - Send to client
// POST /api/tax-organizers/[id]/remind - Send reminder
```

### Bookkeeping API (/api/bookkeeping/*)

```typescript
// GET /api/bookkeeping/transactions - List transactions
// POST /api/bookkeeping/transactions - Create transaction
// PUT /api/bookkeeping/transactions/[id] - Update transaction
// POST /api/bookkeeping/transactions/[id]/categorize - Categorize
// POST /api/bookkeeping/transactions/bulk-categorize - Bulk categorize
// GET /api/bookkeeping/accounts - Get chart of accounts
// POST /api/bookkeeping/accounts - Create account
// GET /api/bookkeeping/reconciliation - Get reconciliation
// POST /api/bookkeeping/reconciliation - Save reconciliation
```

### Bank Connections API (/api/bank-connections)

```typescript
// GET /api/bank-connections - List connections
// POST /api/bank-connections/link - Create Plaid link token
// POST /api/bank-connections/exchange - Exchange public token
// POST /api/bank-connections/[id]/sync - Sync transactions
// DELETE /api/bank-connections/[id] - Remove connection
```

### Time & Billing API (/api/time-entries, /api/invoices)

```typescript
// GET /api/time-entries - List time entries
// POST /api/time-entries - Create time entry
// PUT /api/time-entries/[id] - Update time entry
// DELETE /api/time-entries/[id] - Delete time entry
// GET /api/invoices - List invoices
// POST /api/invoices - Generate invoice
// PUT /api/invoices/[id] - Update invoice
// POST /api/invoices/[id]/send - Send to client
// POST /api/invoices/[id]/payment - Record payment
```

### AI APIs (/api/ai/*)

```typescript
// POST /api/ai/categorize - Categorize transactions
// POST /api/ai/process-receipt - Process receipt with OCR
// POST /api/ai/find-deductions - Find tax deductions
// POST /api/ai/match-transactions - Match receipts to transactions
```

## UI Components

### Dashboard Page
- Work items due this week
- Clients needing attention
- Revenue metrics
- Time tracked this week
- Document requests pending
- Tax return progress (during tax season)

### Clients Page
- Client list with search/filters
- Client cards or table view
- Click to view client detail
- New client button
- Import clients option

### Client Detail Page
- Client info header
- Tabs: Overview, Work, Documents, Tax, Bookkeeping, Billing, Messages
- Service summary
- Quick actions

### Work Dashboard
- Kanban board by status
- List view option
- Filters: type, assignee, client, due date
- Click to view work item
- Create from template

### Work Item Detail Page
- Work item header with status
- Task checklist
- Documents section
- Time entries
- Comments/activity
- Team assignments

### Tax Dashboard
- Returns by status
- Deadline calendar
- Organizer progress
- Extension tracking
- E-file status

### Tax Organizer Page
- Client questionnaire
- Document checklist with upload
- Prior year comparison
- Progress tracker
- Send reminder action

### Bookkeeping Dashboard
- Uncategorized transactions
- Recent activity
- Account balances
- Reconciliation status
- Quick categorize queue

### Transaction Categorization Page
- Transaction list with filters
- AI suggestions column
- Quick categorize buttons
- Bulk categorize option
- Split transaction modal

### Reports Page
- WIP (Work in Progress)
- Utilization by staff
- Revenue by client/service
- Aging report
- Tax season metrics

### Client Portal Pages
- Document upload
- Tax organizer questionnaire
- Message center
- Invoice payment
- E-signature

## AI Features

### Transaction Categorizer
- Auto-categorize bank transactions
- Learn from corrections
- Vendor recognition
- Split suggestions
- Confidence scores

### Receipt Processor
- OCR extraction
- Vendor/amount/date extraction
- Match to transactions
- Category suggestion
- Store extracted data

### Tax Deduction Finder
- Analyze transactions
- Industry-specific deductions
- Missing deduction alerts
- Prior year comparison
- Documentation checklist

## start.sh Script

```bash
#!/bin/bash

echo "Starting Financial Services AI..."

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

# Seed database
echo "Seeding database..."
npx prisma db seed 2>/dev/null || echo "Database may already be seeded"

# Start the development server
echo "Starting Next.js development server..."
npm run dev
```

## Environment Variables (.env.example)

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/financial_services_ai"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI (for AI features)
OPENAI_API_KEY="sk-..."

# Plaid (for bank connections)
PLAID_CLIENT_ID="..."
PLAID_SECRET="..."
PLAID_ENV="sandbox"

# QuickBooks
QUICKBOOKS_CLIENT_ID="..."
QUICKBOOKS_CLIENT_SECRET="..."

# Xero
XERO_CLIENT_ID="..."
XERO_CLIENT_SECRET="..."

# Stripe (for payments)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# File uploads
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"
```

## Color Scheme

- Primary: Indigo (#4F46E5)
- Secondary: Slate (#64748B)
- Success: Green (#22C55E)
- Warning: Amber (#F59E0B)
- Error: Red (#EF4444)
- Background: White (#FFFFFF)
- Surface: Gray (#F8FAFC)
- Text: Slate (#0F172A)

Build this complete financial services application with all features working, AI-powered transaction categorization, client portal, and comprehensive workflow management.
