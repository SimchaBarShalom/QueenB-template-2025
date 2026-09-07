const prisma = require("../lib/prisma");
const { countUsedCapacity } = require("../lib/capacity");
const { currentMonthRange } = require("../lib/dates");

const MENTOR_REQUEST_INCLUDE = {
  mentee: {
    select: {
      id: true,
      fullName: true,
      profileImageUrl: true,
      jobTitle: true,
      workplace: true,
    },
  },
  mentorProfile: {
    select: {
      id: true,
      meetingDurationMinutes: true,
      mentoringTopics: true,
    },
  },
  schedulingRounds: {
    include: { offeredSlots: { orderBy: { startTime: "asc" } } },
    orderBy: { roundNumber: "desc" },
  },
  meetings: {
    include: {
      outcomeConfirmations: {
        select: { userId: true, occurred: true },
      },
      feedback: {
        select: { authorId: true, answers: true },
      },
    },
    orderBy: { scheduledStart: "desc" },
  },
  notifications: {
    where: {
      channel: "IN_APP",
    },
    select: {
      id: true,
      type: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  },
};

const ACTIVE_REQUEST_STATUSES = [
  "WAITING_FOR_MENTOR_SLOTS",
  "WAITING_FOR_MENTEE_SELECTION",
  "MATCHED",
  "ATTENDANCE_CONFIRMED",
];

// `details` is merged into the JSON error body by the route layer, for the few
// failures the client has to react to rather than just display.
function createServiceError(message, statusCode, details) {
  const error = new Error(message);
  error.statusCode = statusCode;

  if (details) {
    error.details = details;
  }

  return error;
}

function hasExtraSlotsRound(request) {
  return (request.schedulingRounds || []).some((round) => round.type === "EXTRA_SLOTS");
}

async function assertCanCreateRequest(menteeId, mentorProfileId) {
  const activeRequest = await prisma.mentoringRequest.findFirst({
    where: {
      menteeId,
      mentorProfileId,
      status: { in: ACTIVE_REQUEST_STATUSES },
    },
    select: { id: true },
  });

  if (activeRequest) {
    throw createServiceError("כבר קיימת בקשה פעילה עם מנטורית זו", 409);
  }

  const { start, end } = currentMonthRange();
  const monthlyBlock = await prisma.mentoringRequest.findFirst({
    where: {
      menteeId,
      mentorProfileId,
      status: "CANCELLED",
      updatedAt: { gte: start, lt: end },
      schedulingRounds: { some: { type: "EXTRA_SLOTS" } },
      notifications: {
        some: {
          type: "RESCHEDULE_REQUIRED",
          channel: "IN_APP",
        },
      },
    },
    select: { id: true },
  });

  if (monthlyBlock) {
    throw createServiceError(
      "לא ניתן לקבוע פגישה חדשה עם מנטורית זו עד החודש הבא",
      409
    );
  }

  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { id: mentorProfileId },
    select: { meetingCapacity: true },
  });

  if (!mentorProfile) {
    throw createServiceError("המנטורית לא נמצאה", 404);
  }

  const usedCapacity = await countUsedCapacity(prisma, mentorProfileId);

  if (usedCapacity >= mentorProfile.meetingCapacity) {
    throw createServiceError("המנטורית הגיעה למכסת הפגישות שלה החודש", 409);
  }
}

async function createMentoringRequest({ menteeId, mentorProfileId }) {
  const mentee = Number(menteeId);
  const mentor = Number(mentorProfileId);

  await assertCanCreateRequest(mentee, mentor);

  return prisma.mentoringRequest.create({
    data: {
      menteeId: mentee,
      mentorProfileId: mentor,
      status: "WAITING_FOR_MENTOR_SLOTS",
    },
  });
}

async function getMentoringRequestsByMentee(menteeId) {
  const requests = await prisma.mentoringRequest.findMany({
    where: {
      menteeId: Number(menteeId),
    },

    include: {
      mentorProfile: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              jobTitle: true,
              workplace: true,
              profileImageUrl: true,
            },
          },

          mentoringTopics: true,
        },
      },

      schedulingRounds: {
        include: {
          offeredSlots: true,
        },
        orderBy: {
          roundNumber: "desc",
        },
      },

      meetings: {
        include: {
          outcomeConfirmations: {
            select: { userId: true, occurred: true },
          },
          feedback: {
            select: { authorId: true, answers: true },
          },
        },
        orderBy: {
          attemptNumber: "desc",
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return requests;
}

async function getMentoringRequestsByMentorUser(userId) {
  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: Number(userId) },
    select: { id: true },
  });

  if (!mentorProfile) {
    throw createServiceError("Only mentors can access mentor meetings", 403);
  }

  return prisma.mentoringRequest.findMany({
    where: { mentorProfileId: mentorProfile.id },
    include: MENTOR_REQUEST_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

async function getOwnedPendingRequest(requestId, userId) {
  const request = await prisma.mentoringRequest.findFirst({
    where: {
      id: Number(requestId),
      mentorProfile: { userId: Number(userId) },
    },
    include: {
      mentorProfile: {
        select: { id: true, meetingDurationMinutes: true, meetingCapacity: true },
      },
      schedulingRounds: {
        select: { roundNumber: true },
        orderBy: { roundNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!request) {
    throw createServiceError("Mentoring request not found", 404);
  }

  if (request.status !== "WAITING_FOR_MENTOR_SLOTS") {
    throw createServiceError("This request is no longer waiting for mentor action", 409);
  }

  return request;
}

function validateAndNormalizeSlots(slots, meetingDurationMinutes) {
  if (!Array.isArray(slots) || slots.length === 0 || slots.length > 10) {
    throw createServiceError("Provide between 1 and 10 time slots", 400);
  }

  const now = Date.now();
  const normalized = slots.map((slot) => {
    const startTime = new Date(slot?.startTime);
    const endTime = new Date(slot?.endTime);

    if (
      Number.isNaN(startTime.getTime()) ||
      Number.isNaN(endTime.getTime()) ||
      startTime.getTime() <= now
    ) {
      throw createServiceError("Every slot must have a valid future start and end time", 400);
    }

    const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
    if (durationMinutes !== meetingDurationMinutes) {
      throw createServiceError(
        `Every slot must be exactly ${meetingDurationMinutes} minutes`,
        400
      );
    }

    return { startTime, endTime };
  });

  normalized.sort((first, second) => first.startTime - second.startTime);

  for (let index = 1; index < normalized.length; index += 1) {
    if (normalized[index].startTime < normalized[index - 1].endTime) {
      throw createServiceError("Offered time slots cannot overlap", 400);
    }
  }

  return normalized;
}

async function rejectMentoringRequest({ requestId, userId }) {
  const request = await getOwnedPendingRequest(requestId, userId);

  return prisma.mentoringRequest.update({
    where: { id: request.id },
    data: { status: "REJECTED" },
    include: MENTOR_REQUEST_INCLUDE,
  });
}

// A slot can only ever be picked if its own month still has a free seat, so an
// offer only breaches capacity once every month it spans is full. Returns null
// when there is still room somewhere, otherwise the fullest picture to show the
// mentor when asking her to confirm going over.
async function findOfferCapacityBreach(mentorProfile, normalizedSlots) {
  const monthsByKey = new Map();

  normalizedSlots.forEach((slot) => {
    const key = `${slot.startTime.getFullYear()}-${slot.startTime.getMonth()}`;

    if (!monthsByKey.has(key)) {
      monthsByKey.set(key, slot.startTime);
    }
  });

  const usage = await Promise.all(
    Array.from(monthsByKey.values(), (month) =>
      countUsedCapacity(prisma, mentorProfile.id, { month })
    )
  );

  if (usage.some((used) => used < mentorProfile.meetingCapacity)) {
    return null;
  }

  return {
    code: "CAPACITY_EXCEEDED",
    usedCapacity: Math.min(...usage),
    meetingCapacity: mentorProfile.meetingCapacity,
  };
}

async function offerMentoringRequestSlots({
  requestId,
  userId,
  slots,
  confirmOverCapacity = false,
}) {
  const request = await getOwnedPendingRequest(requestId, userId);
  const normalizedSlots = validateAndNormalizeSlots(
    slots,
    request.mentorProfile.meetingDurationMinutes
  );

  const breach = await findOfferCapacityBreach(
    request.mentorProfile,
    normalizedSlots
  );

  if (breach && !confirmOverCapacity) {
    throw createServiceError(
      "הצעת הזמנים חורגת ממכסת הפגישות שלך החודש",
      409,
      breach
    );
  }

  const roundNumber = (request.schedulingRounds[0]?.roundNumber || 0) + 1;
  const roundType = roundNumber === 1 ? "INITIAL" : "EXTRA_SLOTS";

  await prisma.$transaction(async (transaction) => {
    const statusUpdate = await transaction.mentoringRequest.updateMany({
      where: {
        id: request.id,
        status: "WAITING_FOR_MENTOR_SLOTS",
      },
      data: breach
        ? { status: "WAITING_FOR_MENTEE_SELECTION", capacityOverride: true }
        : { status: "WAITING_FOR_MENTEE_SELECTION" },
    });

    if (statusUpdate.count !== 1) {
      throw createServiceError("This request was already handled", 409);
    }

    await transaction.schedulingRound.create({
      data: {
        requestId: request.id,
        roundNumber,
        type: roundType,
        offeredSlots: { create: normalizedSlots },
      },
    });
  });

  return prisma.mentoringRequest.findUnique({
    where: { id: request.id },
    include: MENTOR_REQUEST_INCLUDE,
  });
}

async function selectMentoringRequestSlot({ requestId, userId, slotId }) {
  const request = await prisma.mentoringRequest.findFirst({
    where: {
      id: Number(requestId),
      menteeId: Number(userId),
      status: "WAITING_FOR_MENTEE_SELECTION",
    },
    include: {
      mentorProfile: {
        select: {
          id: true,
          userId: true,
          meetingCapacity: true,
        },
      },
      schedulingRounds: {
        include: { offeredSlots: true },
        orderBy: { roundNumber: "desc" },
        take: 1,
      },
      meetings: {
        select: { attemptNumber: true },
        orderBy: { attemptNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!request) {
    throw createServiceError("This request is not waiting for your time selection", 409);
  }

  const selectedSlot = request.schedulingRounds[0]?.offeredSlots.find(
    (slot) => slot.id === Number(slotId)
  );

  if (!selectedSlot) {
    throw createServiceError("The selected time is not part of the latest offer", 400);
  }

  if (selectedSlot.startTime.getTime() <= Date.now()) {
    throw createServiceError("The selected time is no longer available", 409);
  }

  return prisma.$transaction(
    async (transaction) => {
      if (!request.capacityOverride) {
        const usedCapacity = await countUsedCapacity(
          transaction,
          request.mentorProfile.id,
          { month: selectedSlot.startTime, excludeRequestId: request.id }
        );

        if (usedCapacity >= request.mentorProfile.meetingCapacity) {
          throw createServiceError("המנטורית הגיעה למכסת הפגישות שלה בחודש זה", 409);
        }
      }

      const statusUpdate = await transaction.mentoringRequest.updateMany({
        where: {
          id: request.id,
          status: "WAITING_FOR_MENTEE_SELECTION",
        },
        data: { status: "MATCHED" },
      });

      if (statusUpdate.count !== 1) {
        throw createServiceError("This request was already handled", 409);
      }

      await transaction.meeting.create({
        data: {
          requestId: request.id,
          selectedSlotId: selectedSlot.id,
          attemptNumber: (request.meetings[0]?.attemptNumber || 0) + 1,
          scheduledStart: selectedSlot.startTime,
          scheduledEnd: selectedSlot.endTime,
          status: "SCHEDULED",
        },
      });

      await transaction.notification.create({
        data: {
          recipientId: request.mentorProfile.userId,
          requestId: request.id,
          type: "MEETING_MATCHED",
          channel: "IN_APP",
        },
      });

      return transaction.mentoringRequest.findUnique({
        where: { id: request.id },
        include: MENTOR_REQUEST_INCLUDE,
      });
    },
    { isolationLevel: "Serializable" }
  );
}

async function offerRescheduleSlots({ requestId, userId, slots }) {
  const request = await prisma.mentoringRequest.findFirst({
    where: {
      id: Number(requestId),
      status: { in: ["MATCHED", "ATTENDANCE_CONFIRMED"] },
      mentorProfile: { userId: Number(userId) },
    },
    include: {
      mentorProfile: {
        select: { meetingDurationMinutes: true },
      },
      schedulingRounds: {
        select: { roundNumber: true, type: true },
        orderBy: { roundNumber: "desc" },
      },
      meetings: {
        where: { status: { in: ["SCHEDULED", "ATTENDANCE_CONFIRMED"] } },
        orderBy: { attemptNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!request) {
    throw createServiceError("This meeting cannot be rescheduled", 409);
  }

  if (request.schedulingRounds.some((round) => round.type === "RESCHEDULE_BEFORE_MEETING")) {
    throw createServiceError("The meeting has already been rescheduled once", 409);
  }

  const currentMeeting = request.meetings[0];
  if (!currentMeeting || currentMeeting.scheduledStart.getTime() <= Date.now()) {
    throw createServiceError("Only an upcoming meeting can be rescheduled", 409);
  }

  const normalizedSlots = validateAndNormalizeSlots(
    slots,
    request.mentorProfile.meetingDurationMinutes
  );
  const roundNumber = (request.schedulingRounds[0]?.roundNumber || 0) + 1;

  await prisma.$transaction(async (transaction) => {
    const statusUpdate = await transaction.mentoringRequest.updateMany({
      where: {
        id: request.id,
        status: { in: ["MATCHED", "ATTENDANCE_CONFIRMED"] },
      },
      data: { status: "WAITING_FOR_MENTEE_SELECTION" },
    });

    if (statusUpdate.count !== 1) {
      throw createServiceError("This meeting was already changed", 409);
    }

    await transaction.meeting.update({
      where: { id: currentMeeting.id },
      data: { status: "RESCHEDULED" },
    });

    await transaction.schedulingRound.create({
      data: {
        requestId: request.id,
        roundNumber,
        type: "RESCHEDULE_BEFORE_MEETING",
        offeredSlots: { create: normalizedSlots },
      },
    });

    await transaction.notification.create({
      data: {
        recipientId: request.menteeId,
        requestId: request.id,
        meetingId: currentMeeting.id,
        type: "RESCHEDULE_REQUIRED",
        channel: "IN_APP",
      },
    });
  });

  return prisma.mentoringRequest.findUnique({
    where: { id: request.id },
    include: MENTOR_REQUEST_INCLUDE,
  });
}

async function cancelMentoringRequest({
  requestId,
  menteeId,
}) {
  const existingRequest = await prisma.mentoringRequest.findFirst({
    where: {
      id: Number(requestId),
      menteeId: Number(menteeId),
      status: {
        in: ["WAITING_FOR_MENTOR_SLOTS", "WAITING_FOR_MENTEE_SELECTION"],
      },
    },
  });

  if (!existingRequest) {
    throw createServiceError("Mentoring request cannot be cancelled", 409);
  }

  return prisma.mentoringRequest.update({
    where: { id: existingRequest.id },
    data: { status: "CANCELLED" },
    include: MENTOR_REQUEST_INCLUDE,
  });
}

async function declineOfferedSlots({ requestId, menteeId }) {
  const request = await prisma.mentoringRequest.findFirst({
    where: {
      id: Number(requestId),
      menteeId: Number(menteeId),
      status: "WAITING_FOR_MENTEE_SELECTION",
    },
    include: {
      schedulingRounds: {
        select: { type: true },
        orderBy: { roundNumber: "desc" },
      },
      mentorProfile: {
        select: { userId: true },
      },
    },
  });

  if (!request) {
    throw createServiceError("This request is not waiting for a time selection", 409);
  }

  const nextStatus = hasExtraSlotsRound(request)
    ? "CANCELLED"
    : "WAITING_FOR_MENTOR_SLOTS";

  return prisma.$transaction(async (transaction) => {
    await transaction.mentoringRequest.update({
      where: { id: request.id },
      data: { status: nextStatus },
    });

    await transaction.notification.create({
      data: {
        recipientId: request.mentorProfile.userId,
        requestId: request.id,
        type: "RESCHEDULE_REQUIRED",
        channel: "IN_APP",
      },
    });

    return transaction.mentoringRequest.findUnique({
      where: { id: request.id },
      include: MENTOR_REQUEST_INCLUDE,
    });
  });
}

module.exports = {
  createMentoringRequest,
  getMentoringRequestsByMentee,
  getMentoringRequestsByMentorUser,
  offerMentoringRequestSlots,
  selectMentoringRequestSlot,
  offerRescheduleSlots,
  rejectMentoringRequest,
  cancelMentoringRequest,
  declineOfferedSlots,
};