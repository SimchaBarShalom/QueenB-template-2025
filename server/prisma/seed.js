const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function addDays(days, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function createUser(data) {
  const passwordHash = await bcrypt.hash(data.password || "QueenB123", 10);
  return prisma.user.upsert({
    where: { email: data.email },
    update: {
      name: data.name,
      passwordHash,
      role: data.role,
      stack: data.stack,
      workplace: data.workplace,
      yearsExperience: data.yearsExperience,
      photoUrl: data.photoUrl,
      githubUrl: data.githubUrl,
      linkedinUrl: data.linkedinUrl,
      mentorProfile: data.mentorProfile ? {
        upsert: {
          create: data.mentorProfile,
          update: data.mentorProfile,
        },
      } : undefined,
    },
    create: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      stack: data.stack,
      workplace: data.workplace,
      yearsExperience: data.yearsExperience,
      photoUrl: data.photoUrl,
      githubUrl: data.githubUrl,
      linkedinUrl: data.linkedinUrl,
      mentorProfile: data.mentorProfile ? { create: data.mentorProfile } : undefined,
    },
  });
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@queenb.local";

  await createUser({
    name: "מנהלת QueenB",
    email: adminEmail,
    role: "ADMIN",
    password: process.env.ADMIN_PASSWORD || "Admin1234",
  });

  const mentor = await createUser({
    name: "נועה לוי",
    email: "mentor@queenb.local",
    role: "MENTOR",
    stack: "React, Node.js, PostgreSQL",
    workplace: "QueenB Tech",
    yearsExperience: 6,
    githubUrl: "https://github.com/queenb-mentor",
    linkedinUrl: "https://linkedin.com/in/queenb-mentor",
    mentorProfile: {
      background: "מפתחת פולסטאק ומנטורית לבוגרות בתחילת הדרך.",
      topics: "ראיונות טכניים, React, תכנון פרויקט גמר",
      meetingCapacity: 12,
      meetingDurationMinutes: 45,
      meetingLink: "https://meet.google.com/queenb-demo",
    },
  });

  const mentee = await createUser({
    name: "תמר כהן",
    email: "mentee@queenb.local",
    role: "MENTEE",
    stack: "JavaScript, React",
    workplace: "Bootcamp",
    yearsExperience: 1,
  });

  const request = await prisma.mentoringRequest.upsert({
    where: { id: 1 },
    update: {},
    create: {
      mentorId: mentor.id,
      menteeId: mentee.id,
      status: "SLOTS_OFFERED",
      message: "אשמח להתייעץ על הכנה לראיון ראשון.",
      offeredSlots: {
        create: [
          { startsAt: addDays(2, 17), endsAt: addDays(2, 18) },
          { startsAt: addDays(4, 18), endsAt: addDays(4, 19) },
        ],
      },
    },
  });

  const pastRequest = await prisma.mentoringRequest.upsert({
    where: { id: 2 },
    update: {},
    create: {
      mentorId: mentor.id,
      menteeId: mentee.id,
      status: "FEEDBACK_PENDING",
      message: "פגישת דמו שכבר התקיימה.",
    },
  });

  await prisma.meeting.upsert({
    where: { requestId: pastRequest.id },
    update: {},
    create: {
      requestId: pastRequest.id,
      mentorId: mentor.id,
      menteeId: mentee.id,
      startsAt: addDays(-10, 16),
      endsAt: addDays(-10, 17),
      meetingLink: "https://meet.google.com/queenb-demo",
      status: "FEEDBACK_PENDING",
      attendanceConfirmations: {
        create: [
          { userId: mentor.id, happened: true },
          { userId: mentee.id, happened: true },
        ],
      },
    },
  });

  console.log("Seed complete");
  console.log(`Admin: ${adminEmail} / ${process.env.ADMIN_PASSWORD || "Admin1234"}`);
  console.log("Mentor: mentor@queenb.local / QueenB123");
  console.log("Mentee: mentee@queenb.local / QueenB123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
