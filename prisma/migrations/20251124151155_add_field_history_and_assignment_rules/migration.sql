-- CreateEnum
CREATE TYPE "AssignmentMethod" AS ENUM ('ROUND_ROBIN', 'LOAD_BALANCED', 'TERRITORY', 'MANUAL');

-- CreateTable
CREATE TABLE "field_history" (
    "id" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "field_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_assignment_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteria" JSONB NOT NULL,
    "assignmentMethod" "AssignmentMethod" NOT NULL DEFAULT 'ROUND_ROBIN',
    "assignToUserIds" TEXT[],
    "territoryId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_assignment_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "field_history_objectType_objectId_idx" ON "field_history"("objectType", "objectId");

-- CreateIndex
CREATE INDEX "field_history_changedBy_idx" ON "field_history"("changedBy");

-- CreateIndex
CREATE INDEX "field_history_changedAt_idx" ON "field_history"("changedAt");

-- CreateIndex
CREATE INDEX "lead_assignment_rules_isActive_idx" ON "lead_assignment_rules"("isActive");

-- CreateIndex
CREATE INDEX "lead_assignment_rules_priority_idx" ON "lead_assignment_rules"("priority");
