-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('NEW', 'PENDING', 'OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "WorkOrderPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "ServiceAppointmentStatus" AS ENUM ('NONE', 'SCHEDULED', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CANNOT_COMPLETE');

-- CreateEnum
CREATE TYPE "TimeSheetStatus" AS ENUM ('NEW', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AbsenceType" AS ENUM ('VACATION', 'SICK', 'PERSONAL', 'TRAINING', 'JURY_DUTY', 'BEREAVEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ShiftTimeSlotType" AS ENUM ('NORMAL', 'EXTENDED', 'ON_CALL', 'BREAK');

-- CreateEnum
CREATE TYPE "MaintenanceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_contracts" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "contactId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "contractType" TEXT NOT NULL DEFAULT 'WARRANTY',
    "responseTimeHours" INTEGER,
    "resolutionTimeHours" INTEGER,
    "supportHours" TEXT,
    "contractValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "billingFrequency" TEXT,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "renewalTermMonths" INTEGER,
    "terms" TEXT,
    "specialConditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_contract_line_items" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "coverageType" TEXT,

    CONSTRAINT "service_contract_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_reports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reportId" TEXT,
    "reportType" TEXT NOT NULL DEFAULT 'CUSTOM',
    "frequency" TEXT NOT NULL DEFAULT 'WEEKLY',
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "time" TEXT NOT NULL DEFAULT '09:00',
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "recipientEmails" TEXT[],
    "recipientUserIds" TEXT[],
    "format" TEXT NOT NULL DEFAULT 'PDF',
    "includeCharts" BOOLEAN NOT NULL DEFAULT true,
    "filters" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "lastStatus" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_report_executions" (
    "id" TEXT NOT NULL,
    "scheduledReportId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "fileUrl" TEXT,
    "errorMessage" TEXT,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "scheduled_report_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journeys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "type" TEXT NOT NULL DEFAULT 'NURTURE',
    "triggerType" TEXT NOT NULL DEFAULT 'MANUAL',
    "triggerConditions" JSONB,
    "entryLimit" INTEGER,
    "reEntryAllowed" BOOLEAN NOT NULL DEFAULT false,
    "businessHoursOnly" BOOLEAN NOT NULL DEFAULT false,
    "goalType" TEXT,
    "goalConditions" JSONB,
    "totalEntered" INTEGER NOT NULL DEFAULT 0,
    "totalCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalConverted" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_steps" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "emailTemplateId" TEXT,
    "emailSubject" TEXT,
    "emailBody" TEXT,
    "waitDays" INTEGER,
    "waitHours" INTEGER,
    "waitUntilTime" TEXT,
    "conditions" JSONB,
    "actionType" TEXT,
    "actionConfig" JSONB,
    "nextStepId" TEXT,
    "yesStepId" TEXT,
    "noStepId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journey_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_enrollments" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "contactId" TEXT,
    "leadId" TEXT,
    "currentStepId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "exitedAt" TIMESTAMP(3),
    "exitReason" TEXT,
    "emailsSent" INTEGER NOT NULL DEFAULT 0,
    "emailsOpened" INTEGER NOT NULL DEFAULT 0,
    "emailsClicked" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "journey_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surveys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "type" TEXT NOT NULL DEFAULT 'SATISFACTION',
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
    "showProgressBar" BOOLEAN NOT NULL DEFAULT true,
    "randomizeQuestions" BOOLEAN NOT NULL DEFAULT false,
    "headerImage" TEXT,
    "thankYouMessage" TEXT,
    "redirectUrl" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "totalResponses" INTEGER NOT NULL DEFAULT 0,
    "avgCompletionTime" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_questions" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "questionOrder" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "options" TEXT[],
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "minLength" INTEGER,
    "maxLength" INTEGER,
    "minValue" INTEGER,
    "maxValue" INTEGER,
    "showIf" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_responses" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "contactId" TEXT,
    "leadId" TEXT,
    "respondentEmail" TEXT,
    "respondentName" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "completionTime" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_answers" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "textAnswer" TEXT,
    "numberAnswer" DOUBLE PRECISION,
    "selectedOptions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'WEBINAR',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "locationType" TEXT NOT NULL DEFAULT 'ONLINE',
    "venue" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "virtualUrl" TEXT,
    "virtualPlatform" TEXT,
    "maxAttendees" INTEGER,
    "currentAttendees" INTEGER NOT NULL DEFAULT 0,
    "waitlistEnabled" BOOLEAN NOT NULL DEFAULT false,
    "registrationRequired" BOOLEAN NOT NULL DEFAULT true,
    "registrationDeadline" TIMESTAMP(3),
    "registrationFee" DOUBLE PRECISION,
    "agenda" TEXT,
    "speakers" JSONB,
    "bannerImage" TEXT,
    "campaignId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_event_sessions" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "speakers" JSONB,
    "maxAttendees" INTEGER,

    CONSTRAINT "marketing_event_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_event_registrations" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "contactId" TEXT,
    "leadId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "jobTitle" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "checkedInAt" TIMESTAMP(3),
    "checkedInBy" TEXT,
    "paymentStatus" TEXT,
    "paymentAmount" DOUBLE PRECISION,
    "customResponses" JSONB,
    "notes" TEXT,

    CONSTRAINT "marketing_event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_bundles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "bundleType" TEXT NOT NULL DEFAULT 'STATIC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "basePrice" DOUBLE PRECISION,
    "discountPercent" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_bundles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_bundle_items" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_bundle_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "discountType" TEXT,
    "discountValue" DOUBLE PRECISION,
    "productIds" TEXT[],
    "categoryIds" TEXT[],
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guided_selling_questions" (
    "id" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "options" TEXT[],
    "helpText" TEXT,
    "questionOrder" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "filterConditions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guided_selling_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_sync_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "imapHost" TEXT,
    "imapPort" INTEGER,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "syncDirection" TEXT NOT NULL DEFAULT 'BOTH',
    "syncFolders" TEXT[],
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" TEXT,
    "syncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_sync_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_sync_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "calendarId" TEXT,
    "calendarName" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "syncDirection" TEXT NOT NULL DEFAULT 'BOTH',
    "defaultReminder" INTEGER,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" TEXT,
    "syncError" TEXT,
    "colorMapping" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_sync_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_territories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PRIMARY',
    "parentId" TEXT,
    "description" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_territories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operating_hours" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "mondayStart" TEXT,
    "mondayEnd" TEXT,
    "tuesdayStart" TEXT,
    "tuesdayEnd" TEXT,
    "wednesdayStart" TEXT,
    "wednesdayEnd" TEXT,
    "thursdayStart" TEXT,
    "thursdayEnd" TEXT,
    "fridayStart" TEXT,
    "fridayEnd" TEXT,
    "saturdayStart" TEXT,
    "saturdayEnd" TEXT,
    "sundayStart" TEXT,
    "sundayEnd" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operating_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_resources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL DEFAULT 'TECHNICIAN',
    "email" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "territoryId" TEXT,
    "efficiencyRating" DOUBLE PRECISION,
    "travelSpeed" DOUBLE PRECISION,
    "maxTravelDistance" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "skillType" TEXT NOT NULL DEFAULT 'TECHNICAL',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_resource_skills" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "skillLevel" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
    "effectiveStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_resource_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "territory_members" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "territoryId" TEXT NOT NULL,
    "membershipType" TEXT NOT NULL DEFAULT 'PRIMARY',
    "effectiveStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "territory_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_crews" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "crewSize" INTEGER NOT NULL DEFAULT 1,
    "leadId" TEXT,
    "territoryId" TEXT,
    "specialization" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_crews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_absences" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "type" "AbsenceType" NOT NULL DEFAULT 'OTHER',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_absences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "estimatedDurationMinutes" INTEGER NOT NULL DEFAULT 60,
    "skillRequirement" TEXT,
    "blockTimeBefore" INTEGER NOT NULL DEFAULT 0,
    "blockTimeAfter" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL,
    "workOrderNumber" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "accountId" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "budget" DOUBLE PRECISION,
    "region" TEXT,
    "district" TEXT,
    "market" TEXT,
    "territoryId" TEXT,
    "workTypeId" TEXT,
    "priority" "WorkOrderPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'NEW',
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_line_items" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "lineItemNumber" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "workTypeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_order_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_appointments" (
    "id" TEXT NOT NULL,
    "appointmentNumber" TEXT NOT NULL,
    "workOrderId" TEXT,
    "subject" TEXT NOT NULL,
    "status" "ServiceAppointmentStatus" NOT NULL DEFAULT 'NONE',
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "resourceId" TEXT,
    "territoryId" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL,
    "territoryId" TEXT,
    "label" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "timeSlotType" "ShiftTimeSlotType" NOT NULL DEFAULT 'NORMAL',
    "resourceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_sheets" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "TimeSheetStatus" NOT NULL DEFAULT 'NEW',
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_sheet_entries" (
    "id" TEXT NOT NULL,
    "timeSheetId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "workOrderId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'WORK',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "durationHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_sheet_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_service_assets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serialNumber" TEXT,
    "accountName" TEXT,
    "productName" TEXT,
    "installDate" TIMESTAMP(3),
    "warrantyEnd" TIMESTAMP(3),
    "territoryId" TEXT,
    "address" TEXT,
    "lastServiceDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_service_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_plans" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "workTypeId" TEXT,
    "assetId" TEXT,
    "frequency" "MaintenanceFrequency" NOT NULL DEFAULT 'MONTHLY',
    "nextSuggestedDate" TIMESTAMP(3),
    "territoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduling_policies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "policyType" TEXT NOT NULL DEFAULT 'STANDARD',
    "travelTimeOptimization" BOOLEAN NOT NULL DEFAULT true,
    "skillMatching" BOOLEAN NOT NULL DEFAULT true,
    "priorityWeight" INTEGER NOT NULL DEFAULT 50,
    "territoryPreference" TEXT NOT NULL DEFAULT 'PRIMARY',
    "maxTravelDistance" DOUBLE PRECISION,
    "sameDayPolicy" TEXT NOT NULL DEFAULT 'ALLOW',
    "emergencyOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduling_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_cadences" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "type" TEXT NOT NULL DEFAULT 'OUTBOUND',
    "totalSteps" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_cadences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_cadence_steps" (
    "id" TEXT NOT NULL,
    "cadenceId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "stepType" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "waitDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_cadence_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_cadence_enrollments" (
    "id" TEXT NOT NULL,
    "cadenceId" TEXT NOT NULL,
    "contactId" TEXT,
    "leadId" TEXT,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_cadence_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_insights" (
    "id" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "transcript" TEXT,
    "sentiment" TEXT,
    "keyTopics" TEXT[],
    "actionItems" TEXT[],
    "aiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_milestones" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "milestoneName" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "einstein_bots" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "welcomeMessage" TEXT,
    "channels" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "einstein_bots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_dialogs" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL DEFAULT 'KEYWORD',
    "triggers" TEXT[],
    "responses" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_dialogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_posts" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sentiment" TEXT,
    "caseId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging_conversations" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'SMS',
    "contactId" TEXT,
    "phoneNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messaging_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'INBOUND',
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messaging_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_tests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "testType" TEXT NOT NULL DEFAULT 'EMAIL',
    "variantA" JSONB NOT NULL,
    "variantB" JSONB NOT NULL,
    "splitPercent" INTEGER NOT NULL DEFAULT 50,
    "winnerCriteria" TEXT NOT NULL DEFAULT 'OPEN_RATE',
    "results" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ab_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_pages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "htmlContent" TEXT,
    "formConfig" JSONB,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "conversionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dynamic_dashboards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "widgets" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dynamic_dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "validation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_programs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "pointsPerDollar" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "redemptionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "tierEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_tiers" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minPoints" INTEGER NOT NULL DEFAULT 0,
    "benefits" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_members" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "contactId" TEXT,
    "currentPoints" INTEGER NOT NULL DEFAULT 0,
    "lifetimePoints" INTEGER NOT NULL DEFAULT 0,
    "currentTier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_transactions" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_locations" (
    "id" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geo_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_calendars" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PERSONAL',
    "ownerId" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "availability" JSONB NOT NULL,
    "publicToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "bookerName" TEXT NOT NULL,
    "bookerEmail" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_token_idx" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_userId_idx" ON "email_verification_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "service_contracts_contractNumber_key" ON "service_contracts"("contractNumber");

-- CreateIndex
CREATE INDEX "service_contracts_accountId_idx" ON "service_contracts"("accountId");

-- CreateIndex
CREATE INDEX "service_contracts_status_idx" ON "service_contracts"("status");

-- CreateIndex
CREATE INDEX "service_contract_line_items_contractId_idx" ON "service_contract_line_items"("contractId");

-- CreateIndex
CREATE INDEX "scheduled_reports_isActive_idx" ON "scheduled_reports"("isActive");

-- CreateIndex
CREATE INDEX "scheduled_report_executions_scheduledReportId_idx" ON "scheduled_report_executions"("scheduledReportId");

-- CreateIndex
CREATE INDEX "journeys_status_idx" ON "journeys"("status");

-- CreateIndex
CREATE INDEX "journey_steps_journeyId_idx" ON "journey_steps"("journeyId");

-- CreateIndex
CREATE INDEX "journey_enrollments_journeyId_idx" ON "journey_enrollments"("journeyId");

-- CreateIndex
CREATE INDEX "journey_enrollments_status_idx" ON "journey_enrollments"("status");

-- CreateIndex
CREATE INDEX "surveys_status_idx" ON "surveys"("status");

-- CreateIndex
CREATE INDEX "survey_questions_surveyId_idx" ON "survey_questions"("surveyId");

-- CreateIndex
CREATE INDEX "survey_responses_surveyId_idx" ON "survey_responses"("surveyId");

-- CreateIndex
CREATE INDEX "survey_answers_responseId_idx" ON "survey_answers"("responseId");

-- CreateIndex
CREATE INDEX "survey_answers_questionId_idx" ON "survey_answers"("questionId");

-- CreateIndex
CREATE INDEX "marketing_events_status_idx" ON "marketing_events"("status");

-- CreateIndex
CREATE INDEX "marketing_events_startDateTime_idx" ON "marketing_events"("startDateTime");

-- CreateIndex
CREATE INDEX "marketing_event_sessions_eventId_idx" ON "marketing_event_sessions"("eventId");

-- CreateIndex
CREATE INDEX "marketing_event_registrations_eventId_idx" ON "marketing_event_registrations"("eventId");

-- CreateIndex
CREATE INDEX "marketing_event_registrations_email_idx" ON "marketing_event_registrations"("email");

-- CreateIndex
CREATE INDEX "product_bundle_items_bundleId_idx" ON "product_bundle_items"("bundleId");

-- CreateIndex
CREATE UNIQUE INDEX "email_sync_accounts_userId_email_key" ON "email_sync_accounts"("userId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_sync_accounts_userId_email_key" ON "calendar_sync_accounts"("userId", "email");

-- CreateIndex
CREATE INDEX "service_territories_parentId_idx" ON "service_territories"("parentId");

-- CreateIndex
CREATE INDEX "service_territories_isActive_idx" ON "service_territories"("isActive");

-- CreateIndex
CREATE INDEX "service_resources_territoryId_idx" ON "service_resources"("territoryId");

-- CreateIndex
CREATE INDEX "service_resources_isActive_idx" ON "service_resources"("isActive");

-- CreateIndex
CREATE INDEX "service_resource_skills_resourceId_idx" ON "service_resource_skills"("resourceId");

-- CreateIndex
CREATE INDEX "service_resource_skills_skillId_idx" ON "service_resource_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "service_resource_skills_resourceId_skillId_key" ON "service_resource_skills"("resourceId", "skillId");

-- CreateIndex
CREATE INDEX "territory_members_resourceId_idx" ON "territory_members"("resourceId");

-- CreateIndex
CREATE INDEX "territory_members_territoryId_idx" ON "territory_members"("territoryId");

-- CreateIndex
CREATE UNIQUE INDEX "territory_members_resourceId_territoryId_key" ON "territory_members"("resourceId", "territoryId");

-- CreateIndex
CREATE INDEX "service_crews_leadId_idx" ON "service_crews"("leadId");

-- CreateIndex
CREATE INDEX "service_crews_territoryId_idx" ON "service_crews"("territoryId");

-- CreateIndex
CREATE INDEX "resource_absences_resourceId_idx" ON "resource_absences"("resourceId");

-- CreateIndex
CREATE INDEX "resource_absences_startTime_idx" ON "resource_absences"("startTime");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_workOrderNumber_key" ON "work_orders"("workOrderNumber");

-- CreateIndex
CREATE INDEX "work_orders_accountId_idx" ON "work_orders"("accountId");

-- CreateIndex
CREATE INDEX "work_orders_territoryId_idx" ON "work_orders"("territoryId");

-- CreateIndex
CREATE INDEX "work_orders_workTypeId_idx" ON "work_orders"("workTypeId");

-- CreateIndex
CREATE INDEX "work_orders_status_idx" ON "work_orders"("status");

-- CreateIndex
CREATE INDEX "work_orders_priority_idx" ON "work_orders"("priority");

-- CreateIndex
CREATE INDEX "work_order_line_items_workOrderId_idx" ON "work_order_line_items"("workOrderId");

-- CreateIndex
CREATE INDEX "work_order_line_items_workTypeId_idx" ON "work_order_line_items"("workTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "service_appointments_appointmentNumber_key" ON "service_appointments"("appointmentNumber");

-- CreateIndex
CREATE INDEX "service_appointments_workOrderId_idx" ON "service_appointments"("workOrderId");

-- CreateIndex
CREATE INDEX "service_appointments_resourceId_idx" ON "service_appointments"("resourceId");

-- CreateIndex
CREATE INDEX "service_appointments_territoryId_idx" ON "service_appointments"("territoryId");

-- CreateIndex
CREATE INDEX "service_appointments_status_idx" ON "service_appointments"("status");

-- CreateIndex
CREATE INDEX "service_appointments_scheduledStart_idx" ON "service_appointments"("scheduledStart");

-- CreateIndex
CREATE INDEX "shifts_territoryId_idx" ON "shifts"("territoryId");

-- CreateIndex
CREATE INDEX "shifts_resourceId_idx" ON "shifts"("resourceId");

-- CreateIndex
CREATE INDEX "shifts_startTime_idx" ON "shifts"("startTime");

-- CreateIndex
CREATE INDEX "time_sheets_resourceId_idx" ON "time_sheets"("resourceId");

-- CreateIndex
CREATE INDEX "time_sheets_status_idx" ON "time_sheets"("status");

-- CreateIndex
CREATE INDEX "time_sheet_entries_timeSheetId_idx" ON "time_sheet_entries"("timeSheetId");

-- CreateIndex
CREATE INDEX "time_sheet_entries_resourceId_idx" ON "time_sheet_entries"("resourceId");

-- CreateIndex
CREATE INDEX "time_sheet_entries_workOrderId_idx" ON "time_sheet_entries"("workOrderId");

-- CreateIndex
CREATE INDEX "field_service_assets_territoryId_idx" ON "field_service_assets"("territoryId");

-- CreateIndex
CREATE INDEX "field_service_assets_serialNumber_idx" ON "field_service_assets"("serialNumber");

-- CreateIndex
CREATE INDEX "maintenance_plans_workTypeId_idx" ON "maintenance_plans"("workTypeId");

-- CreateIndex
CREATE INDEX "maintenance_plans_assetId_idx" ON "maintenance_plans"("assetId");

-- CreateIndex
CREATE INDEX "maintenance_plans_territoryId_idx" ON "maintenance_plans"("territoryId");

-- CreateIndex
CREATE INDEX "sales_cadences_status_idx" ON "sales_cadences"("status");

-- CreateIndex
CREATE INDEX "sales_cadence_steps_cadenceId_idx" ON "sales_cadence_steps"("cadenceId");

-- CreateIndex
CREATE INDEX "sales_cadence_enrollments_cadenceId_idx" ON "sales_cadence_enrollments"("cadenceId");

-- CreateIndex
CREATE INDEX "sales_cadence_enrollments_status_idx" ON "sales_cadence_enrollments"("status");

-- CreateIndex
CREATE INDEX "conversation_insights_objectType_objectId_idx" ON "conversation_insights"("objectType", "objectId");

-- CreateIndex
CREATE INDEX "case_milestones_caseId_idx" ON "case_milestones"("caseId");

-- CreateIndex
CREATE INDEX "case_milestones_status_idx" ON "case_milestones"("status");

-- CreateIndex
CREATE INDEX "bot_dialogs_botId_idx" ON "bot_dialogs"("botId");

-- CreateIndex
CREATE INDEX "social_posts_platform_idx" ON "social_posts"("platform");

-- CreateIndex
CREATE INDEX "social_posts_caseId_idx" ON "social_posts"("caseId");

-- CreateIndex
CREATE INDEX "social_posts_status_idx" ON "social_posts"("status");

-- CreateIndex
CREATE INDEX "messaging_conversations_contactId_idx" ON "messaging_conversations"("contactId");

-- CreateIndex
CREATE INDEX "messaging_conversations_status_idx" ON "messaging_conversations"("status");

-- CreateIndex
CREATE INDEX "messaging_messages_conversationId_idx" ON "messaging_messages"("conversationId");

-- CreateIndex
CREATE INDEX "ab_tests_status_idx" ON "ab_tests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "landing_pages_slug_key" ON "landing_pages"("slug");

-- CreateIndex
CREATE INDEX "landing_pages_slug_idx" ON "landing_pages"("slug");

-- CreateIndex
CREATE INDEX "landing_pages_status_idx" ON "landing_pages"("status");

-- CreateIndex
CREATE INDEX "dynamic_dashboards_ownerId_idx" ON "dynamic_dashboards"("ownerId");

-- CreateIndex
CREATE INDEX "validation_rules_objectType_idx" ON "validation_rules"("objectType");

-- CreateIndex
CREATE INDEX "validation_rules_isActive_idx" ON "validation_rules"("isActive");

-- CreateIndex
CREATE INDEX "loyalty_tiers_programId_idx" ON "loyalty_tiers"("programId");

-- CreateIndex
CREATE INDEX "loyalty_members_programId_idx" ON "loyalty_members"("programId");

-- CreateIndex
CREATE INDEX "loyalty_members_contactId_idx" ON "loyalty_members"("contactId");

-- CreateIndex
CREATE INDEX "loyalty_transactions_memberId_idx" ON "loyalty_transactions"("memberId");

-- CreateIndex
CREATE INDEX "geo_locations_objectType_objectId_idx" ON "geo_locations"("objectType", "objectId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_calendars_publicToken_key" ON "booking_calendars"("publicToken");

-- CreateIndex
CREATE INDEX "booking_calendars_ownerId_idx" ON "booking_calendars"("ownerId");

-- CreateIndex
CREATE INDEX "bookings_calendarId_idx" ON "bookings"("calendarId");

-- CreateIndex
CREATE INDEX "bookings_startTime_idx" ON "bookings"("startTime");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_contracts" ADD CONSTRAINT "service_contracts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "client_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_contract_line_items" ADD CONSTRAINT "service_contract_line_items_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "service_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_report_executions" ADD CONSTRAINT "scheduled_report_executions_scheduledReportId_fkey" FOREIGN KEY ("scheduledReportId") REFERENCES "scheduled_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_steps" ADD CONSTRAINT "journey_steps_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_enrollments" ADD CONSTRAINT "journey_enrollments_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "survey_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "survey_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_event_sessions" ADD CONSTRAINT "marketing_event_sessions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "marketing_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_event_registrations" ADD CONSTRAINT "marketing_event_registrations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "marketing_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_bundle_items" ADD CONSTRAINT "product_bundle_items_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "product_bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_territories" ADD CONSTRAINT "service_territories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "service_territories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_resources" ADD CONSTRAINT "service_resources_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "service_territories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_resource_skills" ADD CONSTRAINT "service_resource_skills_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "service_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_resource_skills" ADD CONSTRAINT "service_resource_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "territory_members" ADD CONSTRAINT "territory_members_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "service_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "territory_members" ADD CONSTRAINT "territory_members_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "service_territories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_crews" ADD CONSTRAINT "service_crews_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "service_resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_crews" ADD CONSTRAINT "service_crews_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "service_territories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_absences" ADD CONSTRAINT "resource_absences_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "service_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "client_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "service_territories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_workTypeId_fkey" FOREIGN KEY ("workTypeId") REFERENCES "work_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_line_items" ADD CONSTRAINT "work_order_line_items_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_line_items" ADD CONSTRAINT "work_order_line_items_workTypeId_fkey" FOREIGN KEY ("workTypeId") REFERENCES "work_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "service_resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "service_territories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "service_territories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "service_resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_sheets" ADD CONSTRAINT "time_sheets_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "service_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_sheet_entries" ADD CONSTRAINT "time_sheet_entries_timeSheetId_fkey" FOREIGN KEY ("timeSheetId") REFERENCES "time_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_sheet_entries" ADD CONSTRAINT "time_sheet_entries_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "service_resources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_sheet_entries" ADD CONSTRAINT "time_sheet_entries_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_service_assets" ADD CONSTRAINT "field_service_assets_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "service_territories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_plans" ADD CONSTRAINT "maintenance_plans_workTypeId_fkey" FOREIGN KEY ("workTypeId") REFERENCES "work_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_plans" ADD CONSTRAINT "maintenance_plans_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "field_service_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_plans" ADD CONSTRAINT "maintenance_plans_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "service_territories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_cadence_steps" ADD CONSTRAINT "sales_cadence_steps_cadenceId_fkey" FOREIGN KEY ("cadenceId") REFERENCES "sales_cadences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_cadence_enrollments" ADD CONSTRAINT "sales_cadence_enrollments_cadenceId_fkey" FOREIGN KEY ("cadenceId") REFERENCES "sales_cadences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_dialogs" ADD CONSTRAINT "bot_dialogs_botId_fkey" FOREIGN KEY ("botId") REFERENCES "einstein_bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging_messages" ADD CONSTRAINT "messaging_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "messaging_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_tiers" ADD CONSTRAINT "loyalty_tiers_programId_fkey" FOREIGN KEY ("programId") REFERENCES "loyalty_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_members" ADD CONSTRAINT "loyalty_members_programId_fkey" FOREIGN KEY ("programId") REFERENCES "loyalty_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "loyalty_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "booking_calendars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
