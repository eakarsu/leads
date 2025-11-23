-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_campaignId_fkey";

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
