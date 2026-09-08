CREATE TABLE "GoogleCalendarConnection" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "encryptedRefreshToken" TEXT NOT NULL,
    "tokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GoogleCalendarConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GoogleCalendarConnection_userId_key" ON "GoogleCalendarConnection"("userId");

ALTER TABLE "GoogleCalendarConnection"
ADD CONSTRAINT "GoogleCalendarConnection_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Meeting"
ADD COLUMN "googleCalendarEventId" TEXT,
ADD COLUMN "googleCalendarLink" TEXT,
ADD COLUMN "googleMeetLink" TEXT;

CREATE UNIQUE INDEX "Meeting_googleCalendarEventId_key" ON "Meeting"("googleCalendarEventId");
