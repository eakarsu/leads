-- CreateTable
CREATE TABLE "ai_results" (
    "id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "userId" TEXT,
    "objectType" TEXT,
    "objectId" TEXT,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "model" TEXT,
    "tokensUsed" INTEGER,
    "durationMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_results_feature_createdAt_idx" ON "ai_results"("feature", "createdAt");

-- CreateIndex
CREATE INDEX "ai_results_userId_createdAt_idx" ON "ai_results"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_results_objectType_objectId_idx" ON "ai_results"("objectType", "objectId");
