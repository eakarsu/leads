-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('AGENCY', 'CLIENT_SUBMITTED', 'IMPORTED', 'API', 'MANUAL');

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "leadSource" "LeadSource" NOT NULL DEFAULT 'AGENCY',
ADD COLUMN     "submittedBy" TEXT;

-- CreateIndex
CREATE INDEX "leads_leadSource_idx" ON "leads"("leadSource");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
