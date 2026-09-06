const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DEV_PASSWORD = "Password123!";

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function atHour(date, hour, minute = 0) {
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next;
}

async function ensureRequest({ menteeId, mentorProfileId, status, createdAt, updatedAt }) {
  const existing = await prisma.mentoringRequest.findFirst({
    where: { menteeId, mentorProfileId, status },
    orderBy: { id: "asc" },
  });

  if (existing) {
    return prisma.mentoringRequest.update({
      where: { id: existing.id },
      data: { status, createdAt, updatedAt },
    });
  }

  return prisma.mentoringRequest.create({
    data: { menteeId, mentorProfileId, status, createdAt, updatedAt },
  });
}

async function upsertMeeting({ requestId, attemptNumber, scheduledStart, scheduledEnd, status }) {
  return prisma.meeting.upsert({
    where: { requestId_attemptNumber: { requestId, attemptNumber } },
    update: { scheduledStart, scheduledEnd, status },
    create: { requestId, attemptNumber, scheduledStart, scheduledEnd, status },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  const regularUser = await prisma.user.upsert({
    where: { email: "member@queenb.org" },
    update: {},
    create: {
      email: "member@queenb.org",
      passwordHash,
      fullName: "Community Member",
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@queenb.org" },
    update: { isAdmin: true },
    create: {
      email: "admin@queenb.org",
      passwordHash,
      fullName: "QueenB Admin",
      isAdmin: true,
    },
  });

  const mentorUser = await prisma.user.upsert({
    where: { email: "mentor@queenb.org" },
    update: {},
    create: {
      email: "mentor@queenb.org",
      passwordHash,
      fullName: "Example Mentor",
      jobTitle: "Senior Software Engineer",
      workplace: "QueenB Tech",
      yearsOfExperience: 8,
    },
  });

  const menteeUser = await prisma.user.upsert({
    where: { email: "mentee@queenb.org" },
    update: {},
    create: {
      email: "mentee@queenb.org",
      passwordHash,
      fullName: "Example Mentee",
      jobTitle: "Junior Developer",
      workplace: "QueenB Bootcamp",
      yearsOfExperience: 1,
    },
  });

  const secondMenteeUser = await prisma.user.upsert({
    where: { email: "mentee-alerts@queenb.org" },
    update: {},
    create: {
      email: "mentee-alerts@queenb.org",
      passwordHash,
      fullName: "Admin Alerts Mentee",
      jobTitle: "Frontend Developer",
      workplace: "Demo Startup",
      yearsOfExperience: 2,
    },
  });

  const inactiveMentorUser = await prisma.user.upsert({
    where: { email: "inactive-mentor@queenb.org" },
    update: {},
    create: {
      email: "inactive-mentor@queenb.org",
      passwordHash,
      fullName: "Inactive Demo Mentor",
      jobTitle: "Engineering Manager",
      workplace: "Paused Company",
      yearsOfExperience: 10,
    },
  });

  const technologies = await Promise.all(
    ["JavaScript", "Python", "React", "Node.js", "PostgreSQL"].map((name) =>
      prisma.technology.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  const mentoringTopics = await Promise.all(
    ["Mock Interview", "Career Planning", "CV Review"].map((name) =>
      prisma.mentoringTopic.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  const mentorProfile = await prisma.mentorProfile.upsert({
    where: { userId: mentorUser.id },
    update: { isActive: true },
    create: {
      userId: mentorUser.id,
      background:
        "8 years of experience building web applications; happy to mentor on frontend and backend fundamentals.",
      meetingCapacity: 4,
      meetingDurationMinutes: 45,
      mentoringTopics: {
        connect: mentoringTopics.map((topic) => ({ id: topic.id })),
      },
    },
  });

  await prisma.mentorProfile.upsert({
    where: { userId: inactiveMentorUser.id },
    update: { isActive: false },
    create: {
      userId: inactiveMentorUser.id,
      background: "Demo mentor hidden from public search while still visible to admins.",
      meetingCapacity: 2,
      meetingDurationMinutes: 45,
      isActive: false,
      mentoringTopics: {
        connect: mentoringTopics.slice(0, 2).map((topic) => ({ id: topic.id })),
      },
    },
  });

  await prisma.user.update({
    where: { id: regularUser.id },
    data: {
      technologies: {
        connect: technologies.slice(0, 2).map((tech) => ({ id: tech.id })),
      },
    },
  });

  const today = new Date();
  const staleDate = atHour(addDays(today, -10), 9);
  const oldCompletedDate = atHour(addDays(today, -9), 16);
  const noShowDate = atHour(addDays(today, -3), 18);
  const completedDate = atHour(addDays(today, -2), 19);
  const futureDate = atHour(addDays(today, 5), 17);

  await ensureRequest({
    menteeId: menteeUser.id,
    mentorProfileId: mentorProfile.id,
    status: "WAITING_FOR_MENTOR_SLOTS",
    createdAt: staleDate,
    updatedAt: staleDate,
  });

  const futureRequest = await ensureRequest({
    menteeId: menteeUser.id,
    mentorProfileId: mentorProfile.id,
    status: "MATCHED",
    createdAt: addDays(today, -1),
    updatedAt: addDays(today, -1),
  });
  await upsertMeeting({
    requestId: futureRequest.id,
    attemptNumber: 1,
    scheduledStart: futureDate,
    scheduledEnd: atHour(futureDate, 17, 45),
    status: "SCHEDULED",
  });

  const missingFeedbackRequest = await ensureRequest({
    menteeId: secondMenteeUser.id,
    mentorProfileId: mentorProfile.id,
    status: "COMPLETED",
    createdAt: addDays(today, -12),
    updatedAt: oldCompletedDate,
  });
  await upsertMeeting({
    requestId: missingFeedbackRequest.id,
    attemptNumber: 1,
    scheduledStart: oldCompletedDate,
    scheduledEnd: atHour(oldCompletedDate, 16, 45),
    status: "COMPLETED",
  });

  const noShowRequest = await ensureRequest({
    menteeId: secondMenteeUser.id,
    mentorProfileId: mentorProfile.id,
    status: "NOT_COMPLETED",
    createdAt: addDays(today, -5),
    updatedAt: noShowDate,
  });
  await upsertMeeting({
    requestId: noShowRequest.id,
    attemptNumber: 1,
    scheduledStart: noShowDate,
    scheduledEnd: atHour(noShowDate, 18, 45),
    status: "NOT_COMPLETED",
  });

  const feedbackDoneRequest = await ensureRequest({
    menteeId: menteeUser.id,
    mentorProfileId: mentorProfile.id,
    status: "FEEDBACK_COMPLETED",
    createdAt: addDays(today, -4),
    updatedAt: completedDate,
  });
  const feedbackDoneMeeting = await upsertMeeting({
    requestId: feedbackDoneRequest.id,
    attemptNumber: 1,
    scheduledStart: completedDate,
    scheduledEnd: atHour(completedDate, 19, 45),
    status: "COMPLETED",
  });

  await prisma.feedback.upsert({
    where: { meetingId_authorId: { meetingId: feedbackDoneMeeting.id, authorId: menteeUser.id } },
    update: {},
    create: {
      meetingId: feedbackDoneMeeting.id,
      authorId: menteeUser.id,
      answers: { rating: 5, note: "Demo feedback submitted by mentee." },
    },
  });

  await prisma.feedback.upsert({
    where: { meetingId_authorId: { meetingId: feedbackDoneMeeting.id, authorId: mentorUser.id } },
    update: {},
    create: {
      meetingId: feedbackDoneMeeting.id,
      authorId: mentorUser.id,
      answers: { rating: 5, note: "Demo feedback submitted by mentor." },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
