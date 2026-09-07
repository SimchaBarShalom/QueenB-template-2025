const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DEV_PASSWORD = "Password123!";
const MENTEE_EMAILS = [

  "noa@queenb.org",
  "dana@queenb.org",
  "yael@queenb.org",
  "tamar@queenb.org",
  "maya@queenb.org",
  "ronit@queenb.org",
];

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function minutesFrom(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

async function upsertMentee({ email, fullName, jobTitle, workplace, yearsOfExperience, technologies }) {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { fullName, jobTitle, workplace, yearsOfExperience },
    create: {
      email,
      passwordHash,
      fullName,
      jobTitle,
      workplace,
      yearsOfExperience,
    },
  });

  if (technologies.length > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        technologies: {
          set: technologies.map((tech) => ({ id: tech.id })),
        },
      },
    });
  }

  return user;
}

async function replaceDemoRequests(mentorProfileId) {
  const demoRequests = await prisma.mentoringRequest.findMany({
    where: {
      mentorProfileId,
      mentee: { email: { in: MENTEE_EMAILS } },
    },
    select: { id: true },
  });
  const requestIds = demoRequests.map((request) => request.id);

  if (requestIds.length === 0) {
    return;
  }

  await prisma.notification.deleteMany({ where: { requestId: { in: requestIds } } });
  await prisma.attendanceConfirmation.deleteMany({
    where: { meeting: { requestId: { in: requestIds } } },
  });
  await prisma.meetingOutcomeConfirmation.deleteMany({
    where: { meeting: { requestId: { in: requestIds } } },
  });
  await prisma.feedback.deleteMany({
    where: { meeting: { requestId: { in: requestIds } } },
  });
  await prisma.meeting.deleteMany({ where: { requestId: { in: requestIds } } });
  await prisma.offeredSlot.deleteMany({
    where: { schedulingRound: { requestId: { in: requestIds } } },
  });
  await prisma.schedulingRound.deleteMany({ where: { requestId: { in: requestIds } } });
  await prisma.mentoringRequest.deleteMany({ where: { id: { in: requestIds } } });
}

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  await prisma.user.upsert({
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
    update: {
      fullName: "Example Mentor",
      jobTitle: "Senior Software Engineer",
      workplace: "QueenB Tech",
      yearsOfExperience: 8,
    },
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

  const mentorProfile = await prisma.mentorProfile.upsert({
    where: { userId: mentorUser.id },
    update: {
      meetingCapacity: 3,
      meetingDurationMinutes: 45,
      mentoringTopics: {
        set: mentoringTopics.map((topic) => ({ id: topic.id })),
      },
    },
    create: {
      userId: mentorUser.id,
      background:
        "8 years of experience building web applications; happy to mentor on frontend and backend fundamentals.",
      meetingCapacity: 3,
      meetingDurationMinutes: 45,
      mentoringTopics: {
        connect: mentoringTopics.map((topic) => ({ id: topic.id })),
      },
    },
  });

  const communityMember = await upsertMentee({
    email: "member@queenb.org",
    fullName: "Community Member",
    jobTitle: "Junior Developer",
    workplace: "Startup Hub",
    yearsOfExperience: 1,
    technologies: technologies.slice(0, 2),
  });
  const noa = await upsertMentee({
    email: "noa@queenb.org",
    fullName: "Noa Cohen",
    jobTitle: "Computer Science Student",
    workplace: "Tel Aviv University",
    yearsOfExperience: 0,
    technologies: [technologies[0], technologies[2]],
  });
  const dana = await upsertMentee({
    email: "dana@queenb.org",
    fullName: "Dana Levi",
    jobTitle: "QA Engineer",
    workplace: "FinTech Lab",
    yearsOfExperience: 2,
    technologies: [technologies[1], technologies[4]],
  });
  const yael = await upsertMentee({
    email: "yael@queenb.org",
    fullName: "Yael Mizrahi",
    jobTitle: "Frontend Developer",
    workplace: "Product Studio",
    yearsOfExperience: 3,
    technologies: [technologies[2], technologies[0]],
  });
  const tamar = await upsertMentee({
    email: "tamar@queenb.org",
    fullName: "Tamar Avraham",
    jobTitle: "Backend Developer",
    workplace: "CloudWorks",
    yearsOfExperience: 4,
    technologies: [technologies[3], technologies[4]],
  });
  const maya = await upsertMentee({
    email: "maya@queenb.org",
    fullName: "Maya Shapiro",
    jobTitle: "Career Switcher",
    workplace: "Bootcamp Alumni",
    yearsOfExperience: 0,
    technologies: [technologies[0]],
  });
  const ronit = await upsertMentee({
    email: "ronit@queenb.org",
    fullName: "Ronit Bar",
    jobTitle: "Junior Backend Developer",
    workplace: "Community Lab",
    yearsOfExperience: 1,
    technologies: [technologies[1], technologies[3]],
  });

  await replaceDemoRequests(mentorProfile.id);

  const durationMinutes = mentorProfile.meetingDurationMinutes;
  const declinedStart = hoursFromNow(-24);
  const declinedEnd = minutesFrom(declinedStart, durationMinutes);

  await prisma.mentoringRequest.create({
    data: {
      menteeId: communityMember.id,
      mentorProfileId: mentorProfile.id,
      status: "WAITING_FOR_MENTOR_SLOTS",
    },
  });

  await prisma.mentoringRequest.create({
    data: {
      menteeId: noa.id,
      mentorProfileId: mentorProfile.id,
      status: "WAITING_FOR_MENTOR_SLOTS",
      schedulingRounds: {
        create: {
          roundNumber: 1,
          type: "INITIAL",
          offeredSlots: {
            create: [
              {
                startTime: declinedStart,
                endTime: declinedEnd,
              },
            ],
          },
        },
      },
      notifications: {
        create: {
          recipientId: mentorUser.id,
          type: "RESCHEDULE_REQUIRED",
          channel: "IN_APP",
        },
      },
    },
  });

  const upcomingSlotStart = hoursFromNow(48);
  const extraSlotStart = hoursFromNow(72);
  await prisma.mentoringRequest.create({
    data: {
      menteeId: dana.id,
      mentorProfileId: mentorProfile.id,
      status: "WAITING_FOR_MENTEE_SELECTION",
      schedulingRounds: {
        create: {
          roundNumber: 1,
          type: "INITIAL",
          offeredSlots: {
            create: [
              {
                startTime: upcomingSlotStart,
                endTime: minutesFrom(upcomingSlotStart, durationMinutes),
              },
              {
                startTime: extraSlotStart,
                endTime: minutesFrom(extraSlotStart, durationMinutes),
              },
            ],
          },
        },
      },
    },
  });

  const scheduledStart = hoursFromNow(24);
  await prisma.mentoringRequest.create({
    data: {
      menteeId: yael.id,
      mentorProfileId: mentorProfile.id,
      status: "MATCHED",
      meetings: {
        create: {
          attemptNumber: 1,
          scheduledStart,
          scheduledEnd: minutesFrom(scheduledStart, durationMinutes),
          status: "SCHEDULED",
        },
      },
      notifications: {
        create: {
          recipientId: mentorUser.id,
          type: "MEETING_MATCHED",
          channel: "IN_APP",
        },
      },
    },
  });

  const completedStart = hoursFromNow(-72);
  await prisma.mentoringRequest.create({
    data: {
      menteeId: tamar.id,
      mentorProfileId: mentorProfile.id,
      status: "COMPLETED",
      meetings: {
        create: {
          attemptNumber: 1,
          scheduledStart: completedStart,
          scheduledEnd: minutesFrom(completedStart, durationMinutes),
          status: "COMPLETED",
        },
      },
    },
  });

  const blockedInitialStart = hoursFromNow(-120);
  const blockedExtraStart = hoursFromNow(-96);
  await prisma.mentoringRequest.create({
    data: {
      menteeId: maya.id,
      mentorProfileId: mentorProfile.id,
      status: "CANCELLED",
      schedulingRounds: {
        create: [
          {
            roundNumber: 1,
            type: "INITIAL",
            offeredSlots: {
              create: {
                startTime: blockedInitialStart,
                endTime: minutesFrom(blockedInitialStart, durationMinutes),
              },
            },
          },
          {
            roundNumber: 2,
            type: "EXTRA_SLOTS",
            offeredSlots: {
              create: {
                startTime: blockedExtraStart,
                endTime: minutesFrom(blockedExtraStart, durationMinutes),
              },
            },
          },
        ],
      },
      notifications: {
        create: [
          {
            recipientId: mentorUser.id,
            type: "RESCHEDULE_REQUIRED",
            channel: "IN_APP",
          },
          {
            recipientId: mentorUser.id,
            type: "RESCHEDULE_REQUIRED",
            channel: "IN_APP",
          },
        ],
      },
    },
  });

  const outcomeStart = hoursFromNow(-4);
  await prisma.mentoringRequest.create({
    data: {
      menteeId: ronit.id,
      mentorProfileId: mentorProfile.id,
      status: "MATCHED",
      meetings: {
        create: {
          attemptNumber: 1,
          scheduledStart: outcomeStart,
          scheduledEnd: minutesFrom(outcomeStart, durationMinutes),
          status: "SCHEDULED",
        },
      },
    },
  });

  console.log("Seeded mentor@queenb.org with 7 mentee requests.");
  console.log(`All seeded accounts use password: ${DEV_PASSWORD}`);
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