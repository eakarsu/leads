-- CreateEnum
CREATE TYPE "ScoreCategory" AS ENUM ('DEMOGRAPHIC', 'BEHAVIORAL', 'ENGAGEMENT', 'FIRMOGRAPHIC');

-- CreateTable
CREATE TABLE "lead_scores" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "category" "ScoreCategory" NOT NULL,
    "reason" TEXT,
    "factors" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_scores_leadId_idx" ON "lead_scores"("leadId");

-- CreateIndex
CREATE INDEX "lead_scores_calculatedAt_idx" ON "lead_scores"("calculatedAt");
