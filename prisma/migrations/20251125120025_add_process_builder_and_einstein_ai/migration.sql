-- CreateTable
CREATE TABLE "process_flows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "objectType" TEXT NOT NULL,
    "nodes" JSONB NOT NULL,
    "edges" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "process_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_flow_executions" (
    "id" TEXT NOT NULL,
    "processFlowId" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "executionLog" JSONB NOT NULL,

    CONSTRAINT "process_flow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_predictions" (
    "id" TEXT NOT NULL,
    "predictionType" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "prediction" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT,
    "modelVersion" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ai_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_forecasts" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "forecastType" TEXT NOT NULL,
    "predictedAmount" DOUBLE PRECISION NOT NULL,
    "actualAmount" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL,
    "insightType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "actionItems" JSONB NOT NULL,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "process_flows_objectType_idx" ON "process_flows"("objectType");

-- CreateIndex
CREATE INDEX "process_flows_isActive_idx" ON "process_flows"("isActive");

-- CreateIndex
CREATE INDEX "process_flows_createdBy_idx" ON "process_flows"("createdBy");

-- CreateIndex
CREATE INDEX "process_flow_executions_processFlowId_idx" ON "process_flow_executions"("processFlowId");

-- CreateIndex
CREATE INDEX "process_flow_executions_status_idx" ON "process_flow_executions"("status");

-- CreateIndex
CREATE INDEX "process_flow_executions_startedAt_idx" ON "process_flow_executions"("startedAt");

-- CreateIndex
CREATE INDEX "ai_predictions_objectType_objectId_idx" ON "ai_predictions"("objectType", "objectId");

-- CreateIndex
CREATE INDEX "ai_predictions_predictionType_idx" ON "ai_predictions"("predictionType");

-- CreateIndex
CREATE INDEX "ai_predictions_createdAt_idx" ON "ai_predictions"("createdAt");

-- CreateIndex
CREATE INDEX "revenue_forecasts_period_idx" ON "revenue_forecasts"("period");

-- CreateIndex
CREATE INDEX "revenue_forecasts_forecastType_idx" ON "revenue_forecasts"("forecastType");

-- CreateIndex
CREATE INDEX "ai_insights_objectType_objectId_idx" ON "ai_insights"("objectType", "objectId");

-- CreateIndex
CREATE INDEX "ai_insights_insightType_idx" ON "ai_insights"("insightType");

-- CreateIndex
CREATE INDEX "ai_insights_priority_dismissed_idx" ON "ai_insights"("priority", "dismissed");

-- CreateIndex
CREATE INDEX "ai_insights_createdAt_idx" ON "ai_insights"("createdAt");

-- AddForeignKey
ALTER TABLE "process_flows" ADD CONSTRAINT "process_flows_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_flow_executions" ADD CONSTRAINT "process_flow_executions_processFlowId_fkey" FOREIGN KEY ("processFlowId") REFERENCES "process_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
