# Home Services Trades AI - Complete Implementation Prompt

## Project Overview

Build a complete, production-ready Home Services Trades AI field service management system. This is a full-stack web application for HVAC, plumbing, and electrical contractors that includes customer/property management, job scheduling, dispatch optimization, technician mobile app, estimates/invoicing, inventory management, service agreements, and AI-powered features like Dispatch Optimizer and Diagnostics Assistant.

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API Routes, Prisma ORM 5.22.0
- **Database**: PostgreSQL (already running locally, no Docker)
- **Authentication**: NextAuth.js with credentials provider
- **Maps**: Google Maps API for routing and dispatch
- **AI**: OpenAI GPT-4 for diagnostics, route optimization
- **Voice**: Twilio for voice receptionist
- **Payments**: Stripe for customer payments
- **Email/SMS**: Twilio for SMS, Nodemailer for email
- **Real-time**: Socket.io for live dispatch updates

## Project Structure

```
home-services-ai/
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
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx (Customer List)
│   │   │   │   ├── [id]/page.tsx (Customer Detail)
│   │   │   │   └── new/page.tsx (New Customer)
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx (Job Board)
│   │   │   │   ├── [id]/page.tsx (Job Detail)
│   │   │   │   └── new/page.tsx (New Job)
│   │   │   ├── dispatch/
│   │   │   │   ├── page.tsx (Dispatch Board)
│   │   │   │   └── map/page.tsx (Map View)
│   │   │   ├── schedule/
│   │   │   │   └── page.tsx (Schedule Calendar)
│   │   │   ├── estimates/
│   │   │   │   ├── page.tsx (Estimate List)
│   │   │   │   ├── [id]/page.tsx (Estimate Detail)
│   │   │   │   └── new/page.tsx (Create Estimate)
│   │   │   ├── invoices/
│   │   │   │   ├── page.tsx (Invoice List)
│   │   │   │   └── [id]/page.tsx (Invoice Detail)
│   │   │   ├── inventory/
│   │   │   │   ├── page.tsx (Inventory Dashboard)
│   │   │   │   ├── parts/page.tsx
│   │   │   │   └── trucks/page.tsx
│   │   │   ├── agreements/
│   │   │   │   ├── page.tsx (Service Agreements)
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── technicians/
│   │   │   │   ├── page.tsx (Tech List)
│   │   │   │   └── [id]/page.tsx (Tech Profile)
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   ├── ai/
│   │   │   │   ├── dispatch-optimizer/page.tsx
│   │   │   │   └── diagnostics/page.tsx
│   │   │   └── settings/
│   │   │       ├── page.tsx
│   │   │       ├── pricebook/page.tsx
│   │   │       ├── service-types/page.tsx
│   │   │       └── integrations/page.tsx
│   │   ├── tech/ (Technician Mobile App)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx (Today's Jobs)
│   │   │   ├── job/[id]/page.tsx (Job Execution)
│   │   │   ├── estimate/page.tsx (Mobile Estimate)
│   │   │   ├── invoice/page.tsx (Mobile Invoice)
│   │   │   └── inventory/page.tsx (Truck Inventory)
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── customers/route.ts
│   │   │   ├── customers/[id]/route.ts
│   │   │   ├── properties/route.ts
│   │   │   ├── equipment/route.ts
│   │   │   ├── jobs/route.ts
│   │   │   ├── jobs/[id]/route.ts
│   │   │   ├── dispatch/route.ts
│   │   │   ├── dispatch/optimize/route.ts
│   │   │   ├── estimates/route.ts
│   │   │   ├── invoices/route.ts
│   │   │   ├── inventory/route.ts
│   │   │   ├── parts/route.ts
│   │   │   ├── trucks/route.ts
│   │   │   ├── agreements/route.ts
│   │   │   ├── technicians/route.ts
│   │   │   ├── pricebook/route.ts
│   │   │   ├── ai/
│   │   │   │   ├── optimize-dispatch/route.ts
│   │   │   │   ├── optimize-route/route.ts
│   │   │   │   └── diagnostics/route.ts
│   │   │   ├── webhooks/
│   │   │   │   └── stripe/route.ts
│   │   │   └── reports/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── customers/
│   │   │   ├── CustomerCard.tsx
│   │   │   ├── CustomerForm.tsx
│   │   │   ├── CustomerTable.tsx
│   │   │   ├── PropertyCard.tsx
│   │   │   └── EquipmentCard.tsx
│   │   ├── jobs/
│   │   │   ├── JobCard.tsx
│   │   │   ├── JobForm.tsx
│   │   │   ├── JobBoard.tsx
│   │   │   ├── JobTimeline.tsx
│   │   │   └── JobPhotos.tsx
│   │   ├── dispatch/
│   │   │   ├── DispatchBoard.tsx
│   │   │   ├── TechnicianCard.tsx
│   │   │   ├── JobQueue.tsx
│   │   │   ├── MapView.tsx
│   │   │   └── RouteOptimizer.tsx
│   │   ├── estimates/
│   │   │   ├── EstimateBuilder.tsx
│   │   │   ├── GoodBetterBest.tsx
│   │   │   ├── LineItemEditor.tsx
│   │   │   └── EstimatePresentation.tsx
│   │   ├── invoices/
│   │   │   ├── InvoiceGenerator.tsx
│   │   │   ├── PaymentCollector.tsx
│   │   │   └── InvoicePDF.tsx
│   │   ├── inventory/
│   │   │   ├── PartsList.tsx
│   │   │   ├── TruckInventory.tsx
│   │   │   └── InventoryAdjustment.tsx
│   │   ├── agreements/
│   │   │   ├── AgreementCard.tsx
│   │   │   ├── AgreementForm.tsx
│   │   │   └── RenewalTracker.tsx
│   │   └── ai/
│   │       ├── DispatchOptimizer.tsx
│   │       ├── RouteDisplay.tsx
│   │       └── DiagnosticsAssistant.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── utils.ts
│   │   ├── ai.ts
│   │   ├── maps.ts
│   │   ├── sms.ts
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

// ============ COMPANY & USERS ============

model Company {
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
  licenseNumber String?
  serviceArea   String[]  // ZIP codes or city names

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  users         User[]
  customers     Customer[]
  jobs          Job[]
  trucks        Truck[]
  parts         Part[]
  pricebookItems PricebookItem[]
  serviceTypes  ServiceType[]
  agreementPlans AgreementPlan[]
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  firstName     String
  lastName      String
  phone         String?
  role          UserRole
  avatar        String?
  isActive      Boolean   @default(true)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  company       Company   @relation(fields: [companyId], references: [id])
  companyId     String
  technician    Technician?
  createdJobs   Job[]     @relation("CreatedByUser")
}

enum UserRole {
  ADMIN
  MANAGER
  DISPATCHER
  TECHNICIAN
  OFFICE
}

model Technician {
  id            String    @id @default(cuid())
  employeeId    String?
  color         String?   // For calendar display

  // Skills & certifications
  tradeTypes    TradeType[]
  certifications String[]

  // Compensation
  payType       PayType   @default(HOURLY)
  hourlyRate    Decimal?  @db.Decimal(10, 2)
  commissionPct Decimal?  @db.Decimal(5, 2)

  // Current status
  status        TechStatus @default(AVAILABLE)
  currentLat    Decimal?  @db.Decimal(10, 7)
  currentLng    Decimal?  @db.Decimal(10, 7)
  lastLocationUpdate DateTime?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User      @relation(fields: [userId], references: [id])
  userId        String    @unique
  truck         Truck?    @relation(fields: [truckId], references: [id])
  truckId       String?
  schedules     TechSchedule[]
  assignments   JobAssignment[]
  timeEntries   TimeEntry[]
}

enum TradeType {
  HVAC
  PLUMBING
  ELECTRICAL
  GENERAL
}

enum PayType {
  HOURLY
  SALARY
  COMMISSION
  HYBRID
}

enum TechStatus {
  AVAILABLE
  ON_JOB
  EN_ROUTE
  BREAK
  OFF_DUTY
}

model TechSchedule {
  id            String    @id @default(cuid())
  dayOfWeek     Int       // 0-6 (Sunday-Saturday)
  startTime     String    // HH:MM format
  endTime       String
  isWorking     Boolean   @default(true)

  technician    Technician @relation(fields: [technicianId], references: [id])
  technicianId  String

  @@unique([technicianId, dayOfWeek])
}

// ============ CUSTOMERS & PROPERTIES ============

model Customer {
  id            String        @id @default(cuid())
  customerNumber String       @unique
  type          CustomerType  @default(RESIDENTIAL)
  status        CustomerStatus @default(ACTIVE)

  // Contact info
  firstName     String?
  lastName      String?
  companyName   String?
  email         String?
  phone         String?
  mobile        String?
  preferredContact String?   @default("phone")

  // Billing
  billingAddress String?
  billingCity   String?
  billingState  String?
  billingZip    String?

  // Source
  referralSource String?
  referredBy    String?

  // Communication
  doNotCall     Boolean       @default(false)
  doNotEmail    Boolean       @default(false)
  doNotText     Boolean       @default(false)

  notes         String?
  tags          String[]

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  company       Company       @relation(fields: [companyId], references: [id])
  companyId     String
  properties    Property[]
  jobs          Job[]
  estimates     Estimate[]
  invoices      Invoice[]
  agreements    ServiceAgreement[]
  communications Communication[]
}

enum CustomerType {
  RESIDENTIAL
  COMMERCIAL
  PROPERTY_MANAGEMENT
}

enum CustomerStatus {
  ACTIVE
  INACTIVE
  VIP
  DO_NOT_SERVICE
}

model Property {
  id            String    @id @default(cuid())
  name          String?   // "Main Home", "Rental Property", etc.
  type          String?   // House, Apartment, Office, etc.

  // Address
  address       String
  address2      String?
  city          String
  state         String
  zip           String

  // Access info
  gateCode      String?
  accessNotes   String?
  lockboxCode   String?

  // Property details
  sqFootage     Int?
  yearBuilt     Int?
  stories       Int?

  // Pets
  hasPets       Boolean   @default(false)
  petNotes      String?

  notes         String?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  customer      Customer  @relation(fields: [customerId], references: [id])
  customerId    String
  equipment     Equipment[]
  jobs          Job[]
  serviceHistory ServiceHistory[]
}

model Equipment {
  id            String    @id @default(cuid())
  type          EquipmentType
  brand         String?
  model         String?
  serialNumber  String?

  // Installation
  installDate   DateTime?
  installedBy   String?

  // Warranty
  warrantyExpires DateTime?
  warrantyNotes String?

  // Location in property
  location      String?   // Basement, Attic, Garage, etc.

  // Specs (varies by type)
  specs         Json?     // SEER rating, BTU, tonnage, etc.

  // Maintenance
  lastServiceDate DateTime?
  nextServiceDue DateTime?

  // Photos
  photos        String[]

  notes         String?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  property      Property  @relation(fields: [propertyId], references: [id])
  propertyId    String
  serviceHistory ServiceHistory[]
}

enum EquipmentType {
  AC_UNIT
  FURNACE
  HEAT_PUMP
  AIR_HANDLER
  WATER_HEATER
  TANKLESS_WATER_HEATER
  BOILER
  MINI_SPLIT
  THERMOSTAT
  ELECTRICAL_PANEL
  GARBAGE_DISPOSAL
  SUMP_PUMP
  HVAC_PACKAGE
  OTHER
}

model ServiceHistory {
  id            String    @id @default(cuid())
  date          DateTime  @default(now())
  type          String    // Repair, Maintenance, Installation
  description   String
  technicianName String?
  notes         String?

  property      Property  @relation(fields: [propertyId], references: [id])
  propertyId    String
  equipment     Equipment? @relation(fields: [equipmentId], references: [id])
  equipmentId   String?
  job           Job?      @relation(fields: [jobId], references: [id])
  jobId         String?
}

// ============ JOBS ============

model Job {
  id            String      @id @default(cuid())
  jobNumber     String      @unique
  status        JobStatus   @default(PENDING)
  priority      Priority    @default(NORMAL)
  type          JobType     @default(SERVICE_CALL)

  // Trade
  tradeType     TradeType

  // Description
  title         String
  description   String?
  customerPO    String?     // Customer's PO number

  // Scheduling
  scheduledStart DateTime?
  scheduledEnd  DateTime?
  actualStart   DateTime?
  actualEnd     DateTime?
  estimatedDuration Int?    // minutes

  // Window
  timeWindowStart String?   // "8:00 AM"
  timeWindowEnd String?     // "12:00 PM"

  // Location
  propertyId    String?

  // Source
  source        String?     // Phone, Web, Referral, etc.
  leadId        String?

  // Amounts
  estimatedAmount Decimal?  @db.Decimal(10, 2)
  actualAmount  Decimal?    @db.Decimal(10, 2)

  // Completion
  workPerformed String?
  customerSignature String?
  completedAt   DateTime?

  notes         String?
  tags          String[]

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  company       Company     @relation(fields: [companyId], references: [id])
  companyId     String
  customer      Customer    @relation(fields: [customerId], references: [id])
  customerId    String
  property      Property?   @relation(fields: [propertyId], references: [id])
  serviceType   ServiceType? @relation(fields: [serviceTypeId], references: [id])
  serviceTypeId String?
  createdBy     User        @relation("CreatedByUser", fields: [createdById], references: [id])
  createdById   String
  assignments   JobAssignment[]
  timeEntries   TimeEntry[]
  photos        JobPhoto[]
  partsUsed     JobPart[]
  serviceHistory ServiceHistory[]
  estimates     Estimate[]
  invoices      Invoice[]
}

enum JobStatus {
  PENDING
  SCHEDULED
  DISPATCHED
  EN_ROUTE
  IN_PROGRESS
  ON_HOLD
  COMPLETED
  CANCELLED
  INVOICED
}

enum Priority {
  LOW
  NORMAL
  HIGH
  EMERGENCY
}

enum JobType {
  SERVICE_CALL
  REPAIR
  MAINTENANCE
  INSTALLATION
  ESTIMATE_ONLY
  WARRANTY
  CALLBACK
  INSPECTION
}

model ServiceType {
  id            String    @id @default(cuid())
  name          String
  code          String?
  description   String?
  tradeType     TradeType
  defaultDuration Int?    // minutes
  color         String?
  isActive      Boolean   @default(true)

  company       Company   @relation(fields: [companyId], references: [id])
  companyId     String
  jobs          Job[]

  @@unique([companyId, name])
}

model JobAssignment {
  id            String    @id @default(cuid())
  isPrimary     Boolean   @default(false)
  assignedAt    DateTime  @default(now())
  acceptedAt    DateTime?
  declinedAt    DateTime?

  job           Job       @relation(fields: [jobId], references: [id])
  jobId         String
  technician    Technician @relation(fields: [technicianId], references: [id])
  technicianId  String

  @@unique([jobId, technicianId])
}

model TimeEntry {
  id            String      @id @default(cuid())
  type          TimeEntryType @default(WORK)
  startTime     DateTime
  endTime       DateTime?
  duration      Int?        // minutes

  notes         String?

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  job           Job         @relation(fields: [jobId], references: [id])
  jobId         String
  technician    Technician  @relation(fields: [technicianId], references: [id])
  technicianId  String
}

enum TimeEntryType {
  TRAVEL
  WORK
  BREAK
}

model JobPhoto {
  id            String    @id @default(cuid())
  type          PhotoType @default(DURING)
  filePath      String
  caption       String?
  takenAt       DateTime  @default(now())

  job           Job       @relation(fields: [jobId], references: [id])
  jobId         String
}

enum PhotoType {
  BEFORE
  DURING
  AFTER
  EQUIPMENT
  PROBLEM
  SIGNATURE
}

model JobPart {
  id            String    @id @default(cuid())
  quantity      Int
  unitPrice     Decimal   @db.Decimal(10, 2)
  totalPrice    Decimal   @db.Decimal(10, 2)
  markup        Decimal?  @db.Decimal(5, 2)

  job           Job       @relation(fields: [jobId], references: [id])
  jobId         String
  part          Part      @relation(fields: [partId], references: [id])
  partId        String
}

// ============ ESTIMATES ============

model Estimate {
  id              String        @id @default(cuid())
  estimateNumber  String        @unique
  status          EstimateStatus @default(DRAFT)

  // Dates
  createdDate     DateTime      @default(now())
  expirationDate  DateTime?
  approvedAt      DateTime?

  // Options (Good-Better-Best)
  options         EstimateOption[]

  // Selected option
  selectedOption  String?       // good, better, best

  // Totals
  subtotal        Decimal       @db.Decimal(10, 2)
  taxAmount       Decimal       @db.Decimal(10, 2) @default(0)
  totalAmount     Decimal       @db.Decimal(10, 2)

  // Approval
  signatureFile   String?
  signedBy        String?

  notes           String?
  terms           String?

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  customer        Customer      @relation(fields: [customerId], references: [id])
  customerId      String
  job             Job?          @relation(fields: [jobId], references: [id])
  jobId           String?
}

enum EstimateStatus {
  DRAFT
  SENT
  VIEWED
  APPROVED
  DECLINED
  EXPIRED
  CONVERTED
}

model EstimateOption {
  id            String        @id @default(cuid())
  name          String        // Good, Better, Best, or custom
  description   String?
  sortOrder     Int           @default(0)

  subtotal      Decimal       @db.Decimal(10, 2)
  taxAmount     Decimal       @db.Decimal(10, 2) @default(0)
  totalAmount   Decimal       @db.Decimal(10, 2)

  isRecommended Boolean       @default(false)

  estimate      Estimate      @relation(fields: [estimateId], references: [id])
  estimateId    String
  lineItems     EstimateLineItem[]
}

model EstimateLineItem {
  id            String    @id @default(cuid())
  description   String
  quantity      Decimal   @db.Decimal(10, 2)
  unitPrice     Decimal   @db.Decimal(10, 2)
  totalPrice    Decimal   @db.Decimal(10, 2)
  category      String?   // Labor, Parts, Equipment, etc.
  sortOrder     Int       @default(0)
  isOptional    Boolean   @default(false)

  option        EstimateOption @relation(fields: [optionId], references: [id])
  optionId      String
  pricebookItem PricebookItem? @relation(fields: [pricebookItemId], references: [id])
  pricebookItemId String?
}

// ============ INVOICES ============

model Invoice {
  id              String        @id @default(cuid())
  invoiceNumber   String        @unique
  status          InvoiceStatus @default(DRAFT)

  // Dates
  issueDate       DateTime      @default(now())
  dueDate         DateTime
  paidDate        DateTime?

  // Amounts
  subtotal        Decimal       @db.Decimal(10, 2)
  taxRate         Decimal       @db.Decimal(5, 4) @default(0)
  taxAmount       Decimal       @db.Decimal(10, 2) @default(0)
  totalAmount     Decimal       @db.Decimal(10, 2)
  paidAmount      Decimal       @db.Decimal(10, 2) @default(0)
  balanceDue      Decimal       @db.Decimal(10, 2)

  notes           String?
  terms           String?

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  customer        Customer      @relation(fields: [customerId], references: [id])
  customerId      String
  job             Job?          @relation(fields: [jobId], references: [id])
  jobId           String?
  lineItems       InvoiceLineItem[]
  payments        Payment[]
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
  unitPrice     Decimal   @db.Decimal(10, 2)
  totalPrice    Decimal   @db.Decimal(10, 2)
  category      String?   // Labor, Parts, etc.
  sortOrder     Int       @default(0)

  invoice       Invoice   @relation(fields: [invoiceId], references: [id])
  invoiceId     String
}

model Payment {
  id            String        @id @default(cuid())
  amount        Decimal       @db.Decimal(10, 2)
  method        PaymentMethod
  reference     String?       // Check number, last 4 digits, etc.
  date          DateTime      @default(now())
  notes         String?

  // Stripe
  stripePaymentId String?

  invoice       Invoice       @relation(fields: [invoiceId], references: [id])
  invoiceId     String
}

enum PaymentMethod {
  CASH
  CHECK
  CREDIT_CARD
  DEBIT_CARD
  ACH
  FINANCING
  OTHER
}

// ============ PRICEBOOK ============

model PricebookItem {
  id            String    @id @default(cuid())
  code          String
  name          String
  description   String?
  category      String    // Labor, Parts, Equipment, Misc
  type          String    // Flat Rate, Per Hour, Per Unit

  // Pricing
  unitCost      Decimal?  @db.Decimal(10, 2)
  unitPrice     Decimal   @db.Decimal(10, 2)
  laborMinutes  Int?

  // For parts
  manufacturer  String?
  partNumber    String?

  isActive      Boolean   @default(true)
  isTaxable     Boolean   @default(true)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  company       Company   @relation(fields: [companyId], references: [id])
  companyId     String
  estimateLines EstimateLineItem[]

  @@unique([companyId, code])
}

// ============ INVENTORY ============

model Part {
  id            String    @id @default(cuid())
  partNumber    String
  name          String
  description   String?
  category      String?
  manufacturer  String?

  // Pricing
  cost          Decimal   @db.Decimal(10, 2)
  price         Decimal   @db.Decimal(10, 2)
  markup        Decimal?  @db.Decimal(5, 2)

  // Inventory
  quantityOnHand Int      @default(0)
  reorderLevel  Int       @default(0)
  reorderQty    Int       @default(0)

  // Location
  warehouseLocation String?

  isActive      Boolean   @default(true)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  company       Company   @relation(fields: [companyId], references: [id])
  companyId     String
  truckStock    TruckStock[]
  jobParts      JobPart[]
  purchaseOrders PurchaseOrderItem[]

  @@unique([companyId, partNumber])
}

model Truck {
  id            String    @id @default(cuid())
  name          String    // "Truck 1", "Van 3"
  vehicleId     String?   // License plate or fleet number
  make          String?
  model         String?
  year          Int?
  vin           String?
  isActive      Boolean   @default(true)

  company       Company   @relation(fields: [companyId], references: [id])
  companyId     String
  technicians   Technician[]
  stock         TruckStock[]
}

model TruckStock {
  id            String    @id @default(cuid())
  quantity      Int       @default(0)
  minQuantity   Int       @default(0)
  maxQuantity   Int?

  updatedAt     DateTime  @updatedAt

  truck         Truck     @relation(fields: [truckId], references: [id])
  truckId       String
  part          Part      @relation(fields: [partId], references: [id])
  partId        String

  @@unique([truckId, partId])
}

model PurchaseOrder {
  id            String          @id @default(cuid())
  poNumber      String          @unique
  status        POStatus        @default(DRAFT)
  vendorName    String
  vendorContact String?

  orderDate     DateTime        @default(now())
  expectedDate  DateTime?
  receivedDate  DateTime?

  subtotal      Decimal         @db.Decimal(10, 2)
  taxAmount     Decimal         @db.Decimal(10, 2) @default(0)
  totalAmount   Decimal         @db.Decimal(10, 2)

  notes         String?

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  items         PurchaseOrderItem[]
}

enum POStatus {
  DRAFT
  ORDERED
  PARTIAL
  RECEIVED
  CANCELLED
}

model PurchaseOrderItem {
  id            String    @id @default(cuid())
  quantity      Int
  unitCost      Decimal   @db.Decimal(10, 2)
  totalCost     Decimal   @db.Decimal(10, 2)
  receivedQty   Int       @default(0)

  purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])
  purchaseOrderId String
  part          Part      @relation(fields: [partId], references: [id])
  partId        String
}

// ============ SERVICE AGREEMENTS ============

model AgreementPlan {
  id            String    @id @default(cuid())
  name          String    // Bronze, Silver, Gold
  description   String?
  tradeType     TradeType

  // Pricing
  monthlyPrice  Decimal   @db.Decimal(10, 2)
  annualPrice   Decimal   @db.Decimal(10, 2)

  // Benefits
  visitsIncluded Int      @default(1)
  discountPct   Decimal   @db.Decimal(5, 2) @default(0)
  priorityService Boolean @default(false)
  noDiagnosticFee Boolean @default(false)

  // Included services
  includedServices String[]

  isActive      Boolean   @default(true)

  company       Company   @relation(fields: [companyId], references: [id])
  companyId     String
  agreements    ServiceAgreement[]

  @@unique([companyId, name])
}

model ServiceAgreement {
  id            String          @id @default(cuid())
  agreementNumber String        @unique
  status        AgreementStatus @default(ACTIVE)

  // Dates
  startDate     DateTime
  endDate       DateTime
  renewalDate   DateTime?
  cancelledDate DateTime?

  // Billing
  billingFrequency String     // monthly, annual
  paymentMethod String?
  autoRenew     Boolean        @default(true)

  // Tracking
  visitsUsed    Int            @default(0)
  lastVisitDate DateTime?
  nextVisitDue  DateTime?

  notes         String?

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  customer      Customer       @relation(fields: [customerId], references: [id])
  customerId    String
  plan          AgreementPlan  @relation(fields: [planId], references: [id])
  planId        String
  equipment     Json?          // Equipment covered
}

enum AgreementStatus {
  ACTIVE
  PENDING
  EXPIRED
  CANCELLED
  SUSPENDED
}

// ============ COMMUNICATIONS ============

model Communication {
  id            String            @id @default(cuid())
  type          CommunicationType
  direction     String            // inbound, outbound
  subject       String?
  message       String?
  status        String            @default("sent")
  sentAt        DateTime          @default(now())

  customer      Customer          @relation(fields: [customerId], references: [id])
  customerId    String
}

enum CommunicationType {
  EMAIL
  SMS
  PHONE
  NOTE
}
```

## Seed Data (prisma/seed.ts)

Create comprehensive seed data including:

1. **Company**: "Comfort Pro HVAC & Plumbing"

2. **Users** (6 users):
   - Mike Johnson (Admin, Owner)
   - Sarah Davis (Dispatcher)
   - Tom Wilson (Technician, HVAC)
   - Chris Martinez (Technician, Plumbing)
   - Dave Brown (Technician, HVAC & Electrical)
   - Lisa Anderson (Office Manager)

3. **Technicians** (3 technicians):
   - Tom Wilson - HVAC certified, EPA 608, 10 years exp
   - Chris Martinez - Master Plumber, Gas certified
   - Dave Brown - HVAC & Electrical, Journeyman

4. **Trucks** (3 trucks):
   - Truck 1 - Ford E-350 Van (Tom)
   - Truck 2 - Chevy Express (Chris)
   - Truck 3 - Ford Transit (Dave)

5. **Service Types** (12 types):
   - HVAC Repair
   - HVAC Maintenance
   - AC Installation
   - Furnace Installation
   - Plumbing Repair
   - Plumbing Maintenance
   - Water Heater Install
   - Drain Cleaning
   - Electrical Repair
   - Panel Upgrade
   - Inspection
   - Emergency Service

6. **Pricebook Items** (50 items):
   - Labor rates by type
   - Common parts (capacitors, filters, thermostats)
   - Equipment (AC units, furnaces, water heaters)
   - Flat rate repairs

7. **Parts Inventory** (30 parts):
   - Capacitors, contactors, relays
   - Filters, belts, motors
   - Fittings, valves, pipes
   - Wire, breakers, outlets

8. **Customers** (20 customers):
   - Mix of residential and commercial
   - Full contact info
   - Multiple properties for some

9. **Properties** (25 properties):
   - Various types (house, apartment, office)
   - Complete addresses
   - Access notes, gate codes

10. **Equipment** (40 equipment records):
    - AC units, furnaces, water heaters
    - Make, model, serial numbers
    - Install dates, warranty info

11. **Jobs** (30 jobs):
    - Various statuses (pending, scheduled, in progress, completed)
    - Mix of service types
    - Spread across technicians

12. **Estimates** (10 estimates):
    - Good-Better-Best options
    - Various statuses

13. **Invoices** (15 invoices):
    - Various statuses (draft, sent, paid)
    - With payments

14. **Service Agreements** (15 agreements):
    - Various plans
    - Active and expired

15. **Agreement Plans** (3 plans):
    - Bronze (1 visit, 10% discount, $15/mo)
    - Silver (2 visits, 15% discount, priority, $25/mo)
    - Gold (2 visits, 20% discount, priority, no diagnostic, $35/mo)

## API Endpoints

### Customers API (/api/customers)

```typescript
// GET /api/customers - List customers with search, pagination
// POST /api/customers - Create new customer
// GET /api/customers/[id] - Get customer with properties, equipment
// PUT /api/customers/[id] - Update customer
// DELETE /api/customers/[id] - Soft delete customer
// GET /api/customers/[id]/history - Get service history
```

### Properties API (/api/properties)

```typescript
// POST /api/properties - Add property to customer
// PUT /api/properties/[id] - Update property
// GET /api/properties/[id]/equipment - Get equipment at property
```

### Equipment API (/api/equipment)

```typescript
// POST /api/equipment - Add equipment to property
// PUT /api/equipment/[id] - Update equipment
// GET /api/equipment/[id]/history - Get service history
```

### Jobs API (/api/jobs)

```typescript
// GET /api/jobs - List jobs with filters
// POST /api/jobs - Create new job
// GET /api/jobs/[id] - Get job details
// PUT /api/jobs/[id] - Update job
// POST /api/jobs/[id]/assign - Assign technician
// POST /api/jobs/[id]/dispatch - Dispatch job
// POST /api/jobs/[id]/start - Start job
// POST /api/jobs/[id]/complete - Complete job
// POST /api/jobs/[id]/photos - Upload photos
// POST /api/jobs/[id]/parts - Add parts used
```

### Dispatch API (/api/dispatch)

```typescript
// GET /api/dispatch/board - Get dispatch board data
// POST /api/dispatch/assign - Assign job to tech
// POST /api/dispatch/optimize - AI optimize assignments
// GET /api/dispatch/technicians - Get tech statuses and locations
```

### Estimates API (/api/estimates)

```typescript
// GET /api/estimates - List estimates
// POST /api/estimates - Create estimate
// GET /api/estimates/[id] - Get estimate details
// PUT /api/estimates/[id] - Update estimate
// POST /api/estimates/[id]/send - Send to customer
// POST /api/estimates/[id]/approve - Record approval
// POST /api/estimates/[id]/convert - Convert to job/invoice
```

### Invoices API (/api/invoices)

```typescript
// GET /api/invoices - List invoices
// POST /api/invoices - Create invoice
// GET /api/invoices/[id] - Get invoice details
// PUT /api/invoices/[id] - Update invoice
// POST /api/invoices/[id]/send - Send to customer
// POST /api/invoices/[id]/payment - Record payment
// GET /api/invoices/[id]/pdf - Generate PDF
```

### Inventory API (/api/inventory)

```typescript
// GET /api/parts - List parts
// POST /api/parts - Add part
// PUT /api/parts/[id] - Update part
// GET /api/trucks/[id]/inventory - Get truck inventory
// POST /api/trucks/[id]/inventory - Update truck stock
// POST /api/inventory/transfer - Transfer between trucks
```

### Agreements API (/api/agreements)

```typescript
// GET /api/agreements - List agreements
// POST /api/agreements - Create agreement
// PUT /api/agreements/[id] - Update agreement
// POST /api/agreements/[id]/renew - Renew agreement
// GET /api/agreements/due - Get due for service
```

### AI APIs (/api/ai/*)

```typescript
// POST /api/ai/optimize-dispatch - Optimize job assignments
// POST /api/ai/optimize-route - Optimize tech route
// POST /api/ai/diagnostics - Get diagnostic suggestions
// POST /api/ai/estimate - Generate estimate suggestions
```

## UI Components

### Dashboard Page
- Today's jobs overview
- Revenue metrics (today, week, month)
- Jobs by status cards
- Technician availability
- Agreements expiring
- Customer satisfaction score

### Dispatch Board
- Technician columns with jobs
- Map view with tech locations
- Unassigned job queue
- Drag-drop assignment
- AI optimize button
- Real-time status updates

### Job Board
- Kanban view by status
- List view option
- Filters: date, tech, type, status
- Click to view job details
- Quick dispatch action

### Job Detail Page
- Customer/property info
- Equipment at site
- Job timeline
- Photos section
- Parts used
- Time tracking
- Generate invoice button

### Technician Mobile View (/tech/*)
- Today's schedule
- Job list with navigation
- Click job to execute
- Timer start/stop
- Photo capture
- Parts usage
- Customer signature
- Collect payment
- Offline mode support

### Estimate Builder
- Customer selector
- Good-Better-Best options
- Line item editor with pricebook
- Price calculations
- Preview mode
- Send to customer
- Signature capture

### Customer Detail Page
- Contact info header
- Properties tab with equipment
- Service history
- Invoices
- Agreements
- Communications log

### Inventory Dashboard
- Low stock alerts
- Parts by category
- Truck inventory by tech
- Purchase orders
- Usage reports

### Service Agreements Page
- Agreement list with status
- Renewals due
- Visit tracking
- Revenue metrics
- Quick renew action

## start.sh Script

```bash
#!/bin/bash

echo "Starting Home Services AI..."

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
DATABASE_URL="postgresql://postgres:password@localhost:5432/home_services_ai"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Google Maps
GOOGLE_MAPS_API_KEY="..."

# OpenAI (for AI features)
OPENAI_API_KEY="sk-..."

# Stripe (for payments)
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

# File uploads
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"
```

## Color Scheme

- Primary: Orange (#F97316)
- Secondary: Slate (#64748B)
- Success: Green (#22C55E)
- Warning: Amber (#F59E0B)
- Error: Red (#EF4444)
- Background: White (#FFFFFF)
- Surface: Gray (#F8FAFC)
- Text: Slate (#0F172A)

Build this complete home services field management application with all features working, real-time dispatch updates, mobile-friendly technician app, and AI-powered dispatch optimization.
