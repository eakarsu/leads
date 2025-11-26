-- AlterTable
ALTER TABLE "client_companies" ADD COLUMN     "isPartner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "partnerLevel" TEXT,
ADD COLUMN     "type" TEXT;

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "isPartnerUser" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPortalUser" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "portalStatus" TEXT;
