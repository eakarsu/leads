-- AlterTable
ALTER TABLE "users" ADD COLUMN     "clientId" TEXT;

-- CreateIndex
CREATE INDEX "users_clientId_idx" ON "users"("clientId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
