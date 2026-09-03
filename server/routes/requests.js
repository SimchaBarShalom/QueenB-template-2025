const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");
const { ACTIVE_REQUEST_STATUSES, CAPACITY_STATUSES } = require("../domain/statuses");

const router = express.Router();

const requestInclude = {
  mentor: { select: { id: true, name: true, email: true, stack: true, workplace: true, mentorProfile: true } },
  mentee: { select: { id: true, name: true, email: true, stack: true, workplace: true } },
  offeredSlots: { orderBy: { startsAt: "asc" } },
  meeting: { include: { attendanceConfirmations: true, feedback: true } },
};

async function getRequestForUser(id, user) {
  return prisma.mentoringRequest.findFirst({
    where: {
      id: Number(id),
      OR: [{ mentorId: user.id }, { menteeId: user.id }],
    },
    include: requestInclude,
  });
}

async function assertMentorCapacity(mentorId, requestIdToExclude = null) {
  const mentor = await prisma.user.findFirst({
    where: { id: mentorId, role: "MENTOR" },
    include: { mentorProfile: true },
  });
  if (!mentor?.mentorProfile?.meetingLink) {
    const error = new Error("Mentor profile with meeting link is required");
    error.status = 400;
    throw error;
  }

  const used = await prisma.meeting.count({
    where: {
      mentorId,
      status: { in: CAPACITY_STATUSES },
      ...(requestIdToExclude ? { requestId: { not: requestIdToExclude } } : {}),
    },
  });
  if (used >= mentor.mentorProfile.meetingCapacity) {
    const error = new Error("Mentor capacity reached");
    error.status = 400;
    throw error;
  }
  return mentor;
}

router.post("/", authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== "MENTEE") return res.status(403).json({ error: "Only mentees can request mentoring in the MVP" });
    const mentorId = Number(req.body.mentorId);
    if (!mentorId) return res.status(400).json({ error: "mentorId is required" });

    const mentor = await prisma.user.findFirst({ where: { id: mentorId, role: "MENTOR", mentorProfile: { isActive: true } } });
    if (!mentor) return res.status(404).json({ error: "Mentor not found" });

    const duplicate = await prisma.mentoringRequest.findFirst({
      where: { mentorId, menteeId: req.user.id, status: { in: ACTIVE_REQUEST_STATUSES } },
    });
    if (duplicate) return res.status(409).json({ error: "Active request to this mentor already exists" });

    const request = await prisma.mentoringRequest.create({
      data: { mentorId, menteeId: req.user.id, message: req.body.message || null },
      include: requestInclude,
    });
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const requests = await prisma.mentoringRequest.findMany({
      where: { OR: [{ mentorId: req.user.id }, { menteeId: req.user.id }] },
      include: requestInclude,
      orderBy: { updatedAt: "desc" },
    });
    res.json(requests);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/reject", authenticate, async (req, res, next) => {
  try {
    const request = await getRequestForUser(req.params.id, req.user);
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.mentorId !== req.user.id && request.menteeId !== req.user.id) return res.status(403).json({ error: "Not allowed" });
    if (request.status === "MATCHED" || request.status === "RESCHEDULED") return res.status(400).json({ error: "Use cancel after a meeting is matched" });

    const status = request.mentorId === req.user.id ? "REJECTED_BY_MENTOR" : "CANCELLED";
    const updated = await prisma.mentoringRequest.update({ where: { id: request.id }, data: { status }, include: requestInclude });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/slots", authenticate, async (req, res, next) => {
  try {
    const request = await getRequestForUser(req.params.id, req.user);
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.mentorId !== req.user.id) return res.status(403).json({ error: "Only the mentor can offer slots" });
    if (!["REQUESTED", "MORE_SLOTS_REQUESTED", "RESCHEDULE_REQUESTED"].includes(request.status)) {
      return res.status(400).json({ error: "Slots cannot be offered for this status" });
    }

    const slots = Array.isArray(req.body.slots) ? req.body.slots : [];
    if (!slots.length) return res.status(400).json({ error: "At least one slot is required" });
    const now = new Date();
    const normalized = slots.map((slot) => ({ startsAt: new Date(slot.startsAt), endsAt: new Date(slot.endsAt) }));
    if (normalized.some((slot) => Number.isNaN(slot.startsAt.getTime()) || Number.isNaN(slot.endsAt.getTime()) || slot.startsAt <= now || slot.endsAt <= slot.startsAt)) {
      return res.status(400).json({ error: "Slots must be valid future time ranges" });
    }

    const isReschedule = request.status === "RESCHEDULE_REQUESTED";
    await assertMentorCapacity(request.mentorId, isReschedule ? request.id : null);

    const status = isReschedule ? "RESCHEDULE_REQUESTED" : "SLOTS_OFFERED";
    const updated = await prisma.mentoringRequest.update({
      where: { id: request.id },
      data: {
        status,
        offeredSlots: {
          deleteMany: { selected: false },
          create: normalized,
        },
      },
      include: requestInclude,
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/request-more-slots", authenticate, async (req, res, next) => {
  try {
    const request = await getRequestForUser(req.params.id, req.user);
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.menteeId !== req.user.id) return res.status(403).json({ error: "Only the mentee can request more slots" });
    if (request.status !== "SLOTS_OFFERED") return res.status(400).json({ error: "More slots can only be requested after slots are offered" });
    if (request.extraSlotsRequested) return res.status(400).json({ error: "More slots can only be requested once" });

    const updated = await prisma.mentoringRequest.update({
      where: { id: request.id },
      data: { extraSlotsRequested: true, status: "MORE_SLOTS_REQUESTED" },
      include: requestInclude,
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/select-slot", authenticate, async (req, res, next) => {
  try {
    const request = await getRequestForUser(req.params.id, req.user);
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.menteeId !== req.user.id) return res.status(403).json({ error: "Only the mentee can choose a slot" });
    if (!["SLOTS_OFFERED", "RESCHEDULE_REQUESTED"].includes(request.status)) return res.status(400).json({ error: "No selectable slots are available" });

    const slot = request.offeredSlots.find((candidate) => candidate.id === Number(req.body.slotId));
    if (!slot) return res.status(400).json({ error: "Selected slot was not offered for this request" });

    const meetingStatus = request.status === "RESCHEDULE_REQUESTED" ? "RESCHEDULED" : "MATCHED";
    const mentor = await assertMentorCapacity(request.mentorId, meetingStatus === "RESCHEDULED" ? request.id : null);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.offeredSlot.updateMany({ where: { requestId: request.id }, data: { selected: false } });
      await tx.offeredSlot.update({ where: { id: slot.id }, data: { selected: true } });
      await tx.meeting.upsert({
        where: { requestId: request.id },
        create: {
          requestId: request.id,
          mentorId: request.mentorId,
          menteeId: request.menteeId,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          meetingLink: mentor.mentorProfile.meetingLink,
          status: meetingStatus,
        },
        update: {
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          meetingLink: mentor.mentorProfile.meetingLink,
          status: meetingStatus,
        },
      });
      return tx.mentoringRequest.update({ where: { id: request.id }, data: { status: meetingStatus }, include: requestInclude });
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
