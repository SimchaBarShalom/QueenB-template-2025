const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DEV_PASSWORD = "Password123!";

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

  await prisma.mentorProfile.upsert({
    where: { userId: mentorUser.id },
    update: {},
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

  await prisma.user.update({
    where: { id: regularUser.id },
    data: {
      technologies: {
        connect: technologies.slice(0, 2).map((tech) => ({ id: tech.id })),
      },
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