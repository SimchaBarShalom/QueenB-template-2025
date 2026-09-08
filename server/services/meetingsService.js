const prisma = require("../lib/prisma");

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const MEETING_INCLUDE = {
  request: {
    include: {
      mentee: { select: { id: true, fullName: true } },
      mentorProfile: {
        include: {
          user: { select: { id: true, fullName: true } },
          mentoringTopics: true,
        },
      },
    },
  },
  outcomeConfirmations: true,
  feedback: true,
};

async function getParticipantMeeting(meetingId, userId) {
  const meeting = await prisma.meeting.findFirst({
    where: {
      id: Number(meetingId),
      OR: [
        { request: { menteeId: Number(userId) } },
        { request: { mentorProfile: { userId: Number(userId) } } },
      ],
    },
    include: MEETING_INCLUDE,
  });

  if (!meeting) {
    throw createServiceError("Meeting not found", 404);
  }

  return meeting;
}

async function confirmMeetingOutcome({ meetingId, userId, occurred }) {
  if (typeof occurred !== "boolean") {
    throw createServiceError("occurred must be true or false", 400);
  }

  const meeting = await getParticipantMeeting(meetingId, userId);

  if (meeting.scheduledEnd.getTime() > Date.now()) {
    throw createServiceError("The meeting outcome can only be confirmed after it ends", 409);
  }

  if (meeting.outcomeConfirmations.some((confirmation) => confirmation.userId === Number(userId))) {
    throw createServiceError("You already confirmed this meeting outcome", 409);
  }

  const nextStatus = occurred ? "COMPLETED" : "NOT_COMPLETED";

  return prisma.$transaction(async (transaction) => {
    await transaction.meetingOutcomeConfirmation.create({
      data: {
        meetingId: meeting.id,
        userId: Number(userId),
        occurred,
        wantsReschedule: false,
      },
    });

    if (!["COMPLETED", "NOT_COMPLETED"].includes(meeting.status)) {
      await transaction.meeting.update({
        where: { id: meeting.id },
        data: { status: nextStatus },
      });
      await transaction.mentoringRequest.update({
        where: { id: meeting.requestId },
        data: { status: nextStatus },
      });
    }

    return transaction.meeting.findUnique({
      where: { id: meeting.id },
      include: MEETING_INCLUDE,
    });
  });
}

async function submitMeetingFeedback({ meetingId, userId, rating, text }) {
  const numericRating = Number(rating);
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    throw createServiceError("Rating must be a whole number between 1 and 5", 400);
  }

  const meeting = await getParticipantMeeting(meetingId, userId);

  if (meeting.status !== "COMPLETED") {
    throw createServiceError("Feedback is available only after a completed meeting", 409);
  }

  if (meeting.feedback.some((entry) => entry.authorId === Number(userId))) {
    throw createServiceError("You already submitted feedback for this meeting", 409);
  }

  return prisma.feedback.create({
    data: {
      meetingId: meeting.id,
      authorId: Number(userId),
      answers: {
        rating: numericRating,
        text: typeof text === "string" ? text.trim().slice(0, 1000) : "",
      },
    },
  });
}

module.exports = {
  confirmMeetingOutcome,
  submitMeetingFeedback,
};
