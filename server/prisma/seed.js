const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DEV_PASSWORD = "Password123!";
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

async function createRequestIfMissing(data) {
  const requestData = data.data || data;
  const existing = await prisma.mentoringRequest.findFirst({
    where: { menteeId: requestData.menteeId, mentorProfileId: requestData.mentorProfileId, status: requestData.status },
    orderBy: { id: "asc" },
  });
  return existing || prisma.mentoringRequest.create({ data: requestData });
}

async function upsertMeeting({ requestId, attemptNumber, scheduledStart, scheduledEnd, status }) {
  return prisma.meeting.upsert({
    where: { requestId_attemptNumber: { requestId, attemptNumber } },
    update: { scheduledStart, scheduledEnd, status },
    create: { requestId, attemptNumber, scheduledStart, scheduledEnd, status },
  });
}

const DEMO_MENTOR_NAMES = [
  "יעל כהן", "מיכל לוי", "נועה בן דוד", "שירה אברהם", "תמר פרץ",
  "רותם מזרחי", "דנה פרידמן", "אורית אשכנזי", "מאיה שוורץ", "ליאת ברק",
  "ענבל שלום", "קרן דוידי", "אפרת מלכה", "מורן ישראלי", "אביגיל רום",
  "הדר גולן", "סיון אלון", "רוני קפלן", "גלית סגל", "שרון לביא",
];

const DEMO_MENTEE_NAMES = [
  "אביגיל כהן", "אלה לוי", "אמה בן דוד", "בר כהן", "גילי אברהם",
  "דניאל פרץ", "הילה מזרחי", "ורד פרידמן", "זוהר אשכנזי", "חני שוורץ",
  "טל ברק", "יובל שלום", "כינרת דוידי", "ליה מלכה", "מאי ישראלי",
  "נטע רום", "ספיר גולן", "עדי אלון", "פז קפלן", "צופיה סגל",
  "קרן לביא", "רעות כהן", "שני לוי", "תהל בן דוד", "אור אברהם",
  "איילת פרץ", "בינה מזרחי", "גאיה פרידמן", "דפנה אשכנזי", "הילה שוורץ",
  "ורד ברק", "זיו שלום", "חן דוידי", "לילך מלכה", "מיכאלה ישראלי",
  "נעמה רום", "עופרי גולן", "פנינה אלון", "צאלה קפלן", "רוני סגל",
];

async function upsertDemoUser({ email, fullName, jobTitle, workplace, yearsOfExperience, technologies }) {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { fullName, jobTitle, workplace, yearsOfExperience },
    create: { email, passwordHash, fullName, jobTitle, workplace, yearsOfExperience },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { technologies: { set: technologies.map((technology) => ({ id: technology.id })) } },
  });
  return user;
}

async function ensureDemoRound(requestId, roundNumber, type, startTime, durationMinutes) {
  const existing = await prisma.schedulingRound.findUnique({
    where: { requestId_roundNumber: { requestId, roundNumber } },
    include: { offeredSlots: true },
  });
  if (existing) return existing;
  return prisma.schedulingRound.create({
    data: {
      requestId,
      roundNumber,
      type,
      offeredSlots: {
        create: [0, 2].map((offset) => ({
          startTime: addDays(startTime, offset),
          endTime: minutesFrom(addDays(startTime, offset), durationMinutes),
        })),
      },
    },
    include: { offeredSlots: true },
  });
}

async function ensureDemoNotification({ recipientId, requestId, meetingId, type, createdAt }) {
  const existing = await prisma.notification.findFirst({
    where: { recipientId, requestId: requestId || null, meetingId: meetingId || null, type, channel: "IN_APP" },
  });
  if (existing) return existing;
  return prisma.notification.create({
    data: { recipientId, requestId, meetingId, type, channel: "IN_APP", status: "SENT", createdAt },
  });
}

async function seedMeetingStatusShowcase({ mentors, technologies }) {
  const now = new Date();
  const duration = 45;
  const mentees = [];
  for (let index = 0; index < 8; index += 1) {
    mentees.push(await upsertDemoUser({
      email: `demo-showcase-mentee-${index + 1}@queenb.org`,
      fullName: `Demo Showcase Mentee ${index + 1}`,
      jobTitle: "מפתחת תוכנה",
      workplace: "QueenB Demo Lab",
      yearsOfExperience: index % 3,
      technologies: technologies.slice(0, 2),
    }));
  }

  async function requestFor(index, status) {
    const mentor = mentors[index % mentors.length];
    const existing = await prisma.mentoringRequest.findFirst({ where: { menteeId: mentees[index].id, mentorProfileId: mentor.profile.id } });
    const request = existing || await prisma.mentoringRequest.create({ data: { menteeId: mentees[index].id, mentorProfileId: mentor.profile.id, status, createdAt: addDays(now, -14 - index), updatedAt: addDays(now, -14 - index) } });
    return prisma.mentoringRequest.update({ where: { id: request.id }, data: { status, updatedAt: now } });
  }

  async function meeting(requestId, attemptNumber, slot, status, selectedSlotId) {
    return prisma.meeting.upsert({
      where: { requestId_attemptNumber: { requestId, attemptNumber } },
      update: { scheduledStart: slot.startTime, scheduledEnd: slot.endTime, status, selectedSlotId },
      create: { requestId, attemptNumber, scheduledStart: slot.startTime, scheduledEnd: slot.endTime, status, selectedSlotId },
    });
  }

  const waiting = await requestFor(0, "WAITING_FOR_MENTEE_SELECTION");
  await ensureDemoRound(waiting.id, 1, "INITIAL", addDays(now, 3), duration);
  await ensureDemoNotification({ recipientId: mentees[0].id, requestId: waiting.id, type: "SLOTS_AVAILABLE", createdAt: now });

  const scheduled = await requestFor(1, "MATCHED");
  const scheduledRound = await ensureDemoRound(scheduled.id, 1, "INITIAL", addDays(now, 2), duration);
  const scheduledMeeting = await meeting(scheduled.id, 1, scheduledRound.offeredSlots[0], "SCHEDULED", scheduledRound.offeredSlots[0].id);
  await ensureDemoNotification({ recipientId: mentors[1 % mentors.length].user.id, requestId: scheduled.id, meetingId: scheduledMeeting.id, type: "MEETING_MATCHED", createdAt: now });

  const attendance = await requestFor(2, "ATTENDANCE_CONFIRMED");
  const attendanceRound = await ensureDemoRound(attendance.id, 1, "INITIAL", addDays(now, -2), duration);
  const attendanceMeeting = await meeting(attendance.id, 1, attendanceRound.offeredSlots[0], "ATTENDANCE_CONFIRMED", attendanceRound.offeredSlots[0].id);
  for (const user of [mentees[2], mentors[2 % mentors.length].user]) {
    await prisma.attendanceConfirmation.upsert({ where: { meetingId_userId: { meetingId: attendanceMeeting.id, userId: user.id } }, update: { status: "CONFIRMED", confirmedAt: addDays(now, -1) }, create: { meetingId: attendanceMeeting.id, userId: user.id, status: "CONFIRMED", confirmedAt: addDays(now, -1) } });
  }

  const completed = await requestFor(3, "COMPLETED");
  const completedSlot = { startTime: atHour(addDays(now, -5), 11), endTime: atHour(addDays(now, -5), 11, 45) };
  const completedMeeting = await meeting(completed.id, 1, completedSlot, "COMPLETED");
  for (const user of [mentees[3], mentors[3 % mentors.length].user]) {
    await prisma.meetingOutcomeConfirmation.upsert({ where: { meetingId_userId: { meetingId: completedMeeting.id, userId: user.id } }, update: { occurred: true, wantsReschedule: false }, create: { meetingId: completedMeeting.id, userId: user.id, occurred: true, wantsReschedule: false } });
  }

  const noShow = await requestFor(4, "NOT_COMPLETED");
  const noShowSlot = { startTime: atHour(addDays(now, -4), 15), endTime: atHour(addDays(now, -4), 15, 45) };
  const noShowMeeting = await meeting(noShow.id, 1, noShowSlot, "NOT_COMPLETED");
  await prisma.meetingOutcomeConfirmation.upsert({ where: { meetingId_userId: { meetingId: noShowMeeting.id, userId: mentees[4].id } }, update: { occurred: false, wantsReschedule: true }, create: { meetingId: noShowMeeting.id, userId: mentees[4].id, occurred: false, wantsReschedule: true } });

  const cancelled = await requestFor(5, "CANCELLED");
  await meeting(cancelled.id, 1, { startTime: atHour(addDays(now, -7), 13), endTime: atHour(addDays(now, -7), 13, 45) }, "CANCELLED");

  const rescheduled = await requestFor(6, "MATCHED");
  const originalRound = await ensureDemoRound(rescheduled.id, 1, "INITIAL", addDays(now, -3), duration);
  const rescheduleRound = await ensureDemoRound(rescheduled.id, 2, "RESCHEDULE_BEFORE_MEETING", addDays(now, 4), duration);
  await meeting(rescheduled.id, 1, originalRound.offeredSlots[0], "RESCHEDULED", originalRound.offeredSlots[0].id);
  await meeting(rescheduled.id, 2, rescheduleRound.offeredSlots[0], "SCHEDULED", rescheduleRound.offeredSlots[0].id);

  const feedback = await requestFor(7, "FEEDBACK_COMPLETED");
  const feedbackMeeting = await meeting(feedback.id, 1, { startTime: atHour(addDays(now, -10), 17), endTime: atHour(addDays(now, -10), 17, 45) }, "COMPLETED");
  for (const user of [mentees[7], mentors[7 % mentors.length].user]) {
    await prisma.feedback.upsert({ where: { meetingId_authorId: { meetingId: feedbackMeeting.id, authorId: user.id } }, update: {}, create: { meetingId: feedbackMeeting.id, authorId: user.id, answers: { rating: 5, text: "Demo feedback for the completed mentoring journey." } } });
  }

  console.log("Seeded meeting showcase: waiting selection, scheduled, attendance confirmed, completed, not completed, cancelled, rescheduled, and feedback completed.");
}

async function seedExpandedDemoData({ technologies, mentoringTopics }) {
  const jobTitles = ["מהנדסת תוכנה", "מפתחת Frontend", "מנהלת מוצר", "אנליסטית נתונים", "מעצבת UX/UI"];
  const workplaces = ["Wix", "Monday.com", "Intel", "Fiverr", "סטארטאפ בתחום הבריאות"];
  const mentors = [];

  for (let index = 0; index < DEMO_MENTOR_NAMES.length; index += 1) {
    const user = await upsertDemoUser({
      email: `demo-mentor-${index + 1}@queenb.org`,
      fullName: DEMO_MENTOR_NAMES[index],
      jobTitle: jobTitles[index % jobTitles.length],
      workplace: workplaces[index % workplaces.length],
      yearsOfExperience: 4 + (index % 13),
      technologies: technologies.slice(index % 3, (index % 3) + 3),
    });
    const profile = await prisma.mentorProfile.upsert({
      where: { userId: user.id },
      update: {
        background: `${user.fullName} מביאה ניסיון מעשי בהובלת מוצרים וצוותים טכנולוגיים.`,
        meetingCapacity: 4 + (index % 5),
        meetingDurationMinutes: [30, 45, 60][index % 3],
        isActive: true,
        mentoringTopics: { set: mentoringTopics.slice(index % 3, (index % 3) + 3).map((topic) => ({ id: topic.id })) },
      },
      create: {
        userId: user.id,
        background: `${user.fullName} מביאה ניסיון מעשי בהובלת מוצרים וצוותים טכנולוגיים.`,
        meetingCapacity: 4 + (index % 5),
        meetingDurationMinutes: [30, 45, 60][index % 3],
        mentoringTopics: { connect: mentoringTopics.slice(index % 3, (index % 3) + 3).map((topic) => ({ id: topic.id })) },
      },
    });
    mentors.push({ user, profile });
  }

  const mentees = [];
  for (let index = 0; index < DEMO_MENTEE_NAMES.length; index += 1) {
    mentees.push(await upsertDemoUser({
      email: `demo-mentee-${index + 1}@queenb.org`,
      fullName: DEMO_MENTEE_NAMES[index],
      jobTitle: ["מפתחת בתחילת הדרך", "סטודנטית למדעי המחשב", "בודקת תוכנה", "מנהלת פרויקטים"][index % 4],
      workplace: ["QueenB Bootcamp", "אוניברסיטת תל אביב", "חברת סטארטאפ", "פרילנס"][index % 4],
      yearsOfExperience: index % 5,
      technologies: technologies.slice(index % 4, (index % 4) + 2),
    }));
  }

  const now = new Date();
  const statuses = [
    "WAITING_FOR_MENTOR_SLOTS", "WAITING_FOR_MENTOR_SLOTS", "WAITING_FOR_MENTEE_SELECTION",
    "MATCHED", "ATTENDANCE_CONFIRMED", "COMPLETED", "FEEDBACK_COMPLETED", "CANCELLED",
    "NOT_COMPLETED", "REJECTED",
  ];

  for (let index = 0; index < mentees.length; index += 1) {
    const mentee = mentees[index];
    const mentor = mentors[(index * 3) % mentors.length];
    const status = statuses[index % statuses.length];
    const createdAt = addDays(now, -30 + index);
    const request = await prisma.mentoringRequest.findFirst({
      where: { menteeId: mentee.id, mentorProfileId: mentor.profile.id },
    }) || await prisma.mentoringRequest.create({
      data: { menteeId: mentee.id, mentorProfileId: mentor.profile.id, status, createdAt, updatedAt: createdAt },
    });

    await prisma.mentoringRequest.update({ where: { id: request.id }, data: { status, createdAt, updatedAt: createdAt } });
    const duration = mentor.profile.meetingDurationMinutes;
    let start = status === "MATCHED" || status === "ATTENDANCE_CONFIRMED"
      ? atHour(addDays(now, 1 + (index % 10)), 10 + (index % 6))
      : atHour(addDays(now, -(2 + (index % 20))), 9 + (index % 8));

    if (status === "WAITING_FOR_MENTEE_SELECTION" || status === "MATCHED" || status === "ATTENDANCE_CONFIRMED") {
      const round = await ensureDemoRound(request.id, 1, "INITIAL", addDays(now, 2 + index), duration);
      if (status === "MATCHED" || status === "ATTENDANCE_CONFIRMED") {
        start = round.offeredSlots[0]?.startTime || start;
        const meeting = await prisma.meeting.upsert({
          where: { requestId_attemptNumber: { requestId: request.id, attemptNumber: 1 } },
          update: { scheduledStart: start, scheduledEnd: minutesFrom(start, duration), status: status === "MATCHED" ? "SCHEDULED" : "ATTENDANCE_CONFIRMED", selectedSlotId: round.offeredSlots[0]?.id },
          create: { requestId: request.id, attemptNumber: 1, scheduledStart: start, scheduledEnd: minutesFrom(start, duration), status: status === "MATCHED" ? "SCHEDULED" : "ATTENDANCE_CONFIRMED", selectedSlotId: round.offeredSlots[0]?.id },
        });
        await ensureDemoNotification({ recipientId: mentor.user.id, requestId: request.id, meetingId: meeting.id, type: "MEETING_MATCHED", createdAt });
      } else {
        await ensureDemoNotification({ recipientId: mentee.id, requestId: request.id, type: "SLOTS_AVAILABLE", createdAt });
      }
    }

    if (["COMPLETED", "FEEDBACK_COMPLETED", "NOT_COMPLETED"].includes(status)) {
      const meeting = await prisma.meeting.upsert({
        where: { requestId_attemptNumber: { requestId: request.id, attemptNumber: 1 } },
        update: { scheduledStart: start, scheduledEnd: minutesFrom(start, duration), status: status === "NOT_COMPLETED" ? "NOT_COMPLETED" : "COMPLETED" },
        create: { requestId: request.id, attemptNumber: 1, scheduledStart: start, scheduledEnd: minutesFrom(start, duration), status: status === "NOT_COMPLETED" ? "NOT_COMPLETED" : "COMPLETED" },
      });
      if (status === "FEEDBACK_COMPLETED") {
        for (const author of [mentee, mentor.user]) {
          await prisma.feedback.upsert({
            where: { meetingId_authorId: { meetingId: meeting.id, authorId: author.id } },
            update: {},
            create: { meetingId: meeting.id, authorId: author.id, answers: { rating: 4 + (index % 2), text: "פגישה מועילה ומעשירה." } },
          });
        }
      } else if (status === "COMPLETED") {
        await ensureDemoNotification({ recipientId: mentee.id, requestId: request.id, meetingId: meeting.id, type: "FEEDBACK_REMINDER", createdAt });
      }
    }

    if (status === "CANCELLED" || status === "REJECTED") {
      await ensureDemoNotification({ recipientId: mentee.id, requestId: request.id, type: "REQUEST_REJECTED", createdAt });
    }
  }

  await seedMeetingStatusShowcase({ mentors, technologies });
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

  const restoredUsers = [
    { email: "dan626399@gmail.com", fullName: "Dan", background: "לא צוין" },
    { email: "dandan@gmail.com", fullName: "Dan", background: "לא צוין" },
    { email: "danidani@gmail.com", fullName: "Dani", background: "לא צוין" },
  ];

  for (const restoredUser of restoredUsers) {
    await prisma.user.upsert({
      where: { email: restoredUser.email },
      update: {
        passwordHash,
        fullName: restoredUser.fullName,
        background: restoredUser.background,
      },
      create: {
        email: restoredUser.email,
        passwordHash,
        fullName: restoredUser.fullName,
        background: restoredUser.background,
      },
    });
  }

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
    update: {
      meetingCapacity: 3,
      meetingDurationMinutes: 45,
      isActive: true,
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

  const durationMinutes = mentorProfile.meetingDurationMinutes;
  const declinedStart = hoursFromNow(-24);
  const declinedEnd = minutesFrom(declinedStart, durationMinutes);

  await createRequestIfMissing({
    data: {
      menteeId: communityMember.id,
      mentorProfileId: mentorProfile.id,
      status: "WAITING_FOR_MENTOR_SLOTS",
    },
  });

  await createRequestIfMissing({
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
  await createRequestIfMissing({
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
  await createRequestIfMissing({
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
  await createRequestIfMissing({
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
  await createRequestIfMissing({
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
  await createRequestIfMissing({
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

  await seedExpandedDemoData({ technologies, mentoringTopics });
  console.log(`Seeded ${DEMO_MENTOR_NAMES.length} Hebrew mentors and ${DEMO_MENTEE_NAMES.length} Hebrew mentees with lifecycle demo data.`);
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
