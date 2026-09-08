ALTER TABLE "User" ADD COLUMN "background" TEXT NOT NULL DEFAULT 'לא צוין';

UPDATE "User" u
SET "background" = mp."background"
FROM "MentorProfile" mp
WHERE mp."userId" = u."id"
  AND mp."background" IS NOT NULL
  AND btrim(mp."background") <> '';

ALTER TYPE "NotificationType" ADD VALUE 'MEETING_CANCELLED_BY_MENTOR';
ALTER TYPE "NotificationChannel" ADD VALUE 'EMAIL';
