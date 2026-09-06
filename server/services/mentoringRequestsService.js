const prisma = require("../lib/prisma");

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
    orderBy: { scheduledStart: "desc" },
  },
};

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function createMentoringRequest({ menteeId, mentorProfileId }) {
  const request = await prisma.mentoringRequest.create({
    data: {
      menteeId: Number(menteeId),
      mentorProfileId: Number(mentorProfileId),
      status: "WAITING_FOR_MENTOR_SLOTS",
    },
  });

  return request;
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
        select: { id: true, meetingDurationMinutes: true },
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

async function offerMentoringRequestSlots({ requestId, userId, slots }) {
  const request = await getOwnedPendingRequest(requestId, userId);
  const normalizedSlots = validateAndNormalizeSlots(
    slots,
    request.mentorProfile.meetingDurationMinutes
  );
  const roundNumber = (request.schedulingRounds[0]?.roundNumber || 0) + 1;
  const roundType = roundNumber === 1 ? "INITIAL" : "EXTRA_SLOTS";

  await prisma.$transaction(async (transaction) => {
    const statusUpdate = await transaction.mentoringRequest.updateMany({
      where: {
        id: request.id,
        status: "WAITING_FOR_MENTOR_SLOTS",
      },
      data: { status: "WAITING_FOR_MENTEE_SELECTION" },
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

async function cancelMentoringRequest({
  requestId,
  menteeId,
}) {
  const existingRequest =
    await prisma.mentoringRequest.findFirst({
      where: {
        id: Number(requestId),
        menteeId: Number(menteeId),
        status: {
          in: [
            "WAITING_FOR_MENTOR_SLOTS",
            "WAITING_FOR_MENTEE_SELECTION",
          ],
        },
      },
    });

  if (!existingRequest) {
    throw new Error(
      "Mentoring request cannot be cancelled"
    );
  }

  const cancelledRequest =
    await prisma.mentoringRequest.update({
      where: {
        id: Number(requestId),
      },
      data: {
        status: "CANCELLED",
      },
    });

  return cancelledRequest;
}

module.exports = {
  createMentoringRequest,
  getMentoringRequestsByMentee,
  getMentoringRequestsByMentorUser,
  offerMentoringRequestSlots,
  rejectMentoringRequest,
  cancelMentoringRequest,
};