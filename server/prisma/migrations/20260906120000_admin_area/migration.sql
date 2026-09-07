-- Admin area MVP schema additions.
ALTER TABLE "MentorProfile" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "AdminAlertResolution" (
    "id" SERIAL NOT NULL,
    "alertKey" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "materializedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminAlertResolution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminAlertResolution_alertKey_key" ON "AdminAlertResolution"("alertKey");
CREATE INDEX "AdminAlertResolution_alertType_idx" ON "AdminAlertResolution"("alertType");
CREATE INDEX "AdminAlertResolution_entityType_entityId_idx" ON "AdminAlertResolution"("entityType", "entityId");
CREATE INDEX "AdminAlertResolution_resolvedById_idx" ON "AdminAlertResolution"("resolvedById");

ALTER TABLE "AdminAlertResolution" ADD CONSTRAINT "AdminAlertResolution_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
