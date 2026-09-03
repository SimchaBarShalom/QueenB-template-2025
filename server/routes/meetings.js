const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");
const { isParticipant } = require("../domain/statuses");

const router = express.Router();

const meetingInclude = {
  mentor: { select: { id: true, name: true, email: true } },
  mentee: { select: { id: true, name: true, email: true } },
  attendanceConfirmations: { include: { user: { select: { id: true, name: true, role: true } } } },
  feedback: { include: { user: { select: { id: true, name: true, role: true } } } },
  request: true,
};

async function getMeetingForUser(id, user) {
  return prisma.meeting.findFirst({
    where: { id: Number(id), OR: [{ mentorId: user.id }, { menteeId: user.id }] },
    include: meetingInclude,
  });
}

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const meetings = await prisma.meeting.findMany({
      where: { OR: [{ mentorId: req.user.id }, { menteeId: req.user.id }] },
      include: meetingInclude,
      orderBy: { startsAt: "asc" },
    });
    res.json(meetings);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/reschedule", authenticate, async (req, res, next) => {
  try {
    const meeting = await getMeetingForUser(req.params.id, req.user);
    if (!meeting) return res.status(404).json({ error: "Meeting not found" });
    if (meeting.request.rescheduleUsed) return res.status(400).json({ error: "Reschedule can only be requested once" });
    if (!["MATCHED", "RESCHEDULED"].includes(meeting.status)) return res.status(400).json({ error: "Only matched meetings can be rescheduled" });

    const updated = await prisma.$transaction(async (tx) => {
      await tx.meeting.update({ where: { id: meeting.id }, data: { status: "RESCHEDULE_REQUESTED" } });
      return tx.mentoringRequest.update({
        where: { id: meeting.requestId },
        data: { status: "RESCHEDULE_REQUESTED", rescheduleUsed: true },
        include: {
          mentor: { select: { id: true, name: true, email: true } },
          mentee: { select: { id: true, name: true, email: true } },
          offeredSlots: true,
          meeting: { include: meetingInclude },
        },
      });
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/attendance", authenticate, async (req, res, next) => {
  try {
    const meeting = await getMeetingForUser(req.params.id, req.user);
    if (!meeting) return res.status(404).json({ error: "Meeting not found" });
    if (!isParticipant(meeting, req.user.id)) return res.status(403).json({ error: "Only meeting participants can confirm attendance" });

    const happened = Boolean(req.body.happened);
    const updated = await prisma.$transaction(async (tx) => {
      await tx.attendanceConfirmation.upsert({
        where: { meetingId_userId: { meetingId: meeting.id, userId: req.user.id } },
        create: { meetingId: meeting.id, userId: req.user.id, happened },
        update: { happened },
      });

      const confirmations = await tx.attendanceConfirmation.findMany({ where: { meetingId: meeting.id } });
      const bothConfirmed = confirmations.length >= 2 && confirmations.every((item) => item.happened);
      const anyNoShow = confirmations.some((item) => !item.happened);
      const status = anyNoShow ? "NO_SHOW" : bothConfirmed ? "COMPLETED" : meeting.status;
      return tx.meeting.update({ where: { id: meeting.id }, data: { status }, include: meetingInclude });
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/feedback", authenticate, async (req, res, next) => {
  try {
    const meeting = await getMeetingForUser(req.params.id, req.user);
    if (!meeting) return res.status(404).json({ error: "Meeting not found" });
    if (!isParticipant(meeting, req.user.id)) return res.status(403).json({ error: "Only meeting participants can submit feedback" });
    if (!["COMPLETED", "FEEDBACK_PENDING", "FEEDBACK_COMPLETE"].includes(meeting.status)) {
      return res.status(400).json({ error: "Feedback is available after attendance is confirmed" });
    }
    const rating = Number(req.body.rating);
    if (!rating || rating < 1 || rating > 5 || !req.body.text) {
      return res.status(400).json({ error: "Rating 1-5 and feedback text are required" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.feedback.upsert({
        where: { meetingId_userId: { meetingId: meeting.id, userId: req.user.id } },
        create: { meetingId: meeting.id, userId: req.user.id, rating, text: req.body.text },
        update: { rating, text: req.body.text },
      });
      const feedback = await tx.feedback.findMany({ where: { meetingId: meeting.id } });
      const status = feedback.length >= 2 ? "FEEDBACK_COMPLETE" : "FEEDBACK_PENDING";
      return tx.meeting.update({ where: { id: meeting.id }, data: { status }, include: meetingInclude });
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
