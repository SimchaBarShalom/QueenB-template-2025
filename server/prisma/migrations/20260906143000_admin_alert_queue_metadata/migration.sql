ALTER TABLE "AdminAlertResolution" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE "AdminAlertResolution" ADD COLUMN "assignedAdminId" INTEGER;
ALTER TABLE "AdminAlertResolution" ADD COLUMN "notes" TEXT;
ALTER TABLE "AdminAlertResolution" ADD COLUMN "queueUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "AdminAlertResolution_assignedAdminId_idx" ON "AdminAlertResolution"("assignedAdminId");
CREATE INDEX "AdminAlertResolution_priority_idx" ON "AdminAlertResolution"("priority");

ALTER TABLE "AdminAlertResolution" ADD CONSTRAINT "AdminAlertResolution_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
