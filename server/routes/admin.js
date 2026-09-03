const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { REQUEST_STATUSES } = require("../domain/statuses");

const router = express.Router();

router.use(authenticate, requireAdmin);

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  stack: true,
  workplace: true,
  yearsExperience: true,
  photoUrl: true,
  githubUrl: true,
  linkedinUrl: true,
  createdAt: true,
  updatedAt: true,
  mentorProfile: true,
};

const meetingInclude = {
  mentor: { select: { id: true, name: true, email: true } },
  mentee: { select: { id: true, name: true, email: true } },
  request: true,
  attendanceConfirmations: { include: { user: { select: { id: true, name: true, role: true } } } },
  feedback: { include: { user: { select: { id: true, name: true, role: true } } } },
};

router.get("/users", async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        ...userSelect,
        _count: { select: { mentorMeetings: true, menteeMeetings: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(users.map((user) => ({
      ...user,
      mentorCount: user._count.mentorMeetings,
      menteeCount: user._count.menteeMeetings,
      _count: undefined,
    })));
  } catch (error) {
    next(error);
  }
});

router.get("/users/:id", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      select: {
        ...userSelect,
        mentorMeetings: { include: { mentee: { select: { id: true, name: true } } }, orderBy: { startsAt: "desc" } },
        menteeMeetings: { include: { mentor: { select: { id: true, name: true } } }, orderBy: { startsAt: "desc" } },
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.get("/meetings", async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) {
      if (!REQUEST_STATUSES.includes(req.query.status)) return res.status(400).json({ error: "Invalid status filter" });
      where.status = req.query.status;
    }
    if (req.query.mentorId) where.mentorId = Number(req.query.mentorId);
    if (req.query.menteeId) where.menteeId = Number(req.query.menteeId);

    const meetings = await prisma.meeting.findMany({
      where,
      include: meetingInclude,
      orderBy: { startsAt: "asc" },
    });
    res.json(meetings);
  } catch (error) {
    next(error);
  }
});

router.get("/meetings/:id", async (req, res, next) => {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: Number(req.params.id) },
      include: meetingInclude,
    });
    if (!meeting) return res.status(404).json({ error: "Meeting not found" });
    res.json(meeting);
  } catch (error) {
    next(error);
  }
});

router.get("/alerts", async (req, res, next) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const noShows = await prisma.meeting.findMany({
      where: { status: "NO_SHOW" },
      include: meetingInclude,
      orderBy: { startsAt: "desc" },
    });

    const pastNeedAttendance = await prisma.meeting.findMany({
      where: {
        startsAt: { lt: now },
        status: { in: ["MATCHED", "RESCHEDULED"] },
      },
      include: meetingInclude,
      orderBy: { startsAt: "asc" },
    });

    const missingFeedback = await prisma.meeting.findMany({
      where: {
        startsAt: { lt: weekAgo },
        status: "FEEDBACK_PENDING",
      },
      include: meetingInclude,
      orderBy: { startsAt: "asc" },
    });

    const mentors = await prisma.user.findMany({
      where: { role: "MENTOR" },
      select: {
        id: true,
        name: true,
        email: true,
        _count: { select: { mentorMeetings: true } },
      },
    });

    res.json({
      noShows,
      pastNeedAttendance,
      missingFeedback,
      appreciationMentors: mentors
        .filter((mentor) => mentor._count.mentorMeetings > 10)
        .map((mentor) => ({ id: mentor.id, name: mentor.name, email: mentor.email, meetingCount: mentor._count.mentorMeetings })),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
