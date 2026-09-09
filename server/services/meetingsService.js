const prisma = require("../lib/prisma");
const { countUsedCapacity } = require("../lib/capacity");
const { emailQueue } = require("../queues/emailQueue");
const { createCalendarEvent, isConnected: isGoogleCalendarConnected } = require("./googleCalendarService");

const EMAIL_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: "exponential", delay: 2000 },
};

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

// מכניסה שני jobs נפרדים לתור המיילים (למנטורית ולמנטית) במקום לשלוח
// את המיילים ישירות. ה-worker אחראי לבנות ולשלוח את המייל בפועל, כדי
// שבקשת ה-API לא תחכה לספק המיילים.
async function enqueueMeetingScheduledEmails({ mentor, mentee, meeting }) {
  const jobs = [
    [
      "meeting-scheduled-mentor",
      {
        to: mentor.email,
        mentorName: mentor.fullName,
        menteeName: mentee.fullName,
        scheduledStart: meeting.scheduledStart,
        scheduledEnd: meeting.scheduledEnd,
      },
      `meeting-scheduled-mentor-${meeting.id}`,
    ],
    [
      "meeting-scheduled-mentee",
      {
        to: mentee.email,
        mentorName: mentor.fullName,
        menteeName: mentee.fullName,
        scheduledStart: meeting.scheduledStart,
        scheduledEnd: meeting.scheduledEnd,
      },
      `meeting-scheduled-mentee-${meeting.id}`,
    ],
  ];

  for (const [jobName, data, jobId] of jobs) {
    try {
      await emailQueue.add(jobName, data, { jobId, ...EMAIL_JOB_OPTIONS });
    } catch (error) {
      console.error(`Failed to enqueue "${jobName}" email:`, error);
    }
  }
}

async function createMeetingFromSlot({ requestId, slotId, menteeId }) {
  const request = await prisma.mentoringRequest.findFirst({
    where: {
      id: Number(requestId),
      menteeId: Number(menteeId),
      status: "WAITING_FOR_MENTEE_SELECTION",
    },
    include: {
      mentee: {
        select: { id: true, fullName: true, email: true },
      },
      mentorProfile: {
        select: {
          id: true,
          userId: true,
          meetingCapacity: true,
          user: {
            select: { id: true, fullName: true, email: true },
          },
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
    throw createServiceError(
      "This request is not waiting for your time selection",
      409
    );
  }

  const selectedSlot = request.schedulingRounds[0]?.offeredSlots.find(
    (slot) => slot.id === Number(slotId)
  );

  if (!selectedSlot) {
    throw createServiceError(
      "The selected time is not part of the latest offer",
      400
    );
  }

  if (selectedSlot.startTime.getTime() <= Date.now()) {
    throw createServiceError("The selected time is no longer available", 409);
  }

  if (!(await isGoogleCalendarConnected(request.mentorProfile.userId))) {
    throw createServiceError("המנטורית עדיין לא חיברה את Google Calendar שלה, ולכן לא ניתן לקבוע פגישה עם קישור Google Meet.", 409);
  }

  const activeMeeting = await prisma.meeting.findFirst({
    where: {
      status: { in: ["SCHEDULED", "ATTENDANCE_CONFIRMED"] },
      request: { is: { menteeId: Number(menteeId) } },
    },
    select: { id: true },
  });

  if (activeMeeting) {
    throw createServiceError(
      "יש לך כבר פגישה פעילה. כדי לקבוע פגישה חדשה, בטלי קודם את הפגישה הקיימת.",
      409
    );
  }

  let meeting = await prisma.$transaction(
    async (transaction) => {
      if (!request.capacityOverride) {
        const usedCapacity = await countUsedCapacity(
          transaction,
          request.mentorProfile.id,
          { month: selectedSlot.startTime, excludeRequestId: request.id }
        );

        if (usedCapacity >= request.mentorProfile.meetingCapacity) {
          throw createServiceError("המנטורית הגיעה למכסת הפגישות שלה", 409);
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

      const createdMeeting = await transaction.meeting.create({
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
          meetingId: createdMeeting.id,
          type: "MEETING_MATCHED",
          channel: "IN_APP",
        },
      });

      return createdMeeting;
    },
    { isolationLevel: "Serializable" }
  );

  try {
    const calendarEvent = await createCalendarEvent({
      organizerUserId: request.mentorProfile.userId,
      title: `Queen Match: ${request.mentorProfile.user.fullName} ו-${request.mentee.fullName}`,
      description: "פגישת מנטורינג שנקבעה דרך Queen Match.",
      start: meeting.scheduledStart,
      end: meeting.scheduledEnd,
      attendees: [request.mentee.email],
    });
    meeting = await prisma.meeting.update({
      where: { id: meeting.id },
      data: {
        googleCalendarEventId: calendarEvent.id,
        googleCalendarLink: calendarEvent.calendarLink,
        googleMeetLink: calendarEvent.meetLink,
      },
    });
  } catch (error) {
    console.error("Google Calendar event creation failed for meeting", meeting.id, error);
  }

  await enqueueMeetingScheduledEmails({
    mentor: request.mentorProfile.user,
    mentee: request.mentee,
    meeting,
  });

  return meeting;
}

async function cancelMeeting({ meetingId, userId }) {
  const meeting = await prisma.meeting.findFirst({
    where: {
      id: Number(meetingId),
      status: { in: ["SCHEDULED", "ATTENDANCE_CONFIRMED"] },
      OR: [
        { request: { menteeId: Number(userId) } },
        { request: { mentorProfile: { userId: Number(userId) } } },
      ],
    },
    include: {
      request: {
        include: {
          mentee: { select: { id: true, fullName: true, email: true } },
          mentorProfile: { include: { user: { select: { id: true, fullName: true, email: true } } } },
        },
      },
    },
  });

  if (!meeting) {
    throw createServiceError("Meeting cannot be cancelled", 409);
  }

  const actorIsMentor = meeting.request?.mentorProfile?.user?.id === Number(userId);
  const updatedMeeting = await prisma.$transaction(async (transaction) => {
    const result = await transaction.meeting.update({
      where: { id: meeting.id },
      data: { status: "CANCELLED" },
    });

    await transaction.mentoringRequest.update({
      where: { id: meeting.requestId },
      data: { status: "CANCELLED" },
    });

    if (actorIsMentor) {
      await transaction.notification.create({
        data: {
          recipientId: meeting.request.mentee.id,
          requestId: meeting.requestId,
          meetingId: meeting.id,
          type: "MEETING_CANCELLED_BY_MENTOR",
          channel: "IN_APP",
        },
      });
    }

    return result;
  });

  if (actorIsMentor) {
    const mentor = meeting.request.mentorProfile.user;
    const mentee = meeting.request.mentee;
    try {
      await emailQueue.add(
        "meeting-cancelled",
        {
          to: mentee.email,
          menteeName: mentee.fullName,
          mentorName: mentor.fullName,
          scheduledStart: meeting.scheduledStart,
        },
        { jobId: `meeting-cancelled-${meeting.id}`, ...EMAIL_JOB_OPTIONS }
      );
    } catch (error) {
      console.error("Failed to enqueue meeting cancellation email:", error);
    }
  }

  return updatedMeeting;
}

// A mentee cannot offer new times, so her reschedule action returns the request
// to the mentor's queue. The mentor's existing reschedule-slots action remains
// responsible for offering the replacement times.
async function requestMeetingReschedule({ meetingId, userId }) {
  const meeting = await prisma.meeting.findFirst({
    where: {
      id: Number(meetingId),
      status: { in: ["SCHEDULED", "ATTENDANCE_CONFIRMED"] },
      request: { is: { menteeId: Number(userId) } },
    },
    include: {
      request: {
        include: {
          mentorProfile: { select: { userId: true } },
          schedulingRounds: { select: { roundNumber: true, type: true }, orderBy: { roundNumber: "desc" } },
        },
      },
    },
  });

  if (!meeting || meeting.scheduledStart.getTime() <= Date.now()) {
    throw createServiceError("Only your upcoming meeting can be rescheduled", 409);
  }

  if (meeting.request.schedulingRounds.some((round) => round.type === "RESCHEDULE_BEFORE_MEETING")) {
    throw createServiceError("The meeting has already been rescheduled once", 409);
  }

  return prisma.$transaction(async (transaction) => {
    const requestUpdate = await transaction.mentoringRequest.updateMany({
      where: { id: meeting.requestId, status: { in: ["MATCHED", "ATTENDANCE_CONFIRMED"] } },
      data: { status: "WAITING_FOR_MENTOR_SLOTS" },
    });

    if (requestUpdate.count !== 1) {
      throw createServiceError("This meeting was already changed", 409);
    }

    await transaction.meeting.update({ where: { id: meeting.id }, data: { status: "RESCHEDULED" } });
    await transaction.schedulingRound.create({
      data: {
        requestId: meeting.requestId,
        roundNumber: (meeting.request.schedulingRounds[0]?.roundNumber || 0) + 1,
        type: "RESCHEDULE_BEFORE_MEETING",
      },
    });
    await transaction.notification.create({
      data: {
        recipientId: meeting.request.mentorProfile.userId,
        requestId: meeting.requestId,
        meetingId: meeting.id,
        type: "RESCHEDULE_REQUIRED",
        channel: "IN_APP",
      },
    });

    return transaction.mentoringRequest.findUnique({ where: { id: meeting.requestId } });
  });
}

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
    throw createServiceError(
      "The meeting outcome can only be confirmed after it ends",
      409
    );
  }

  if (
    meeting.outcomeConfirmations.some(
      (confirmation) => confirmation.userId === Number(userId)
    )
  ) {
    throw createServiceError(
      "You already confirmed this meeting outcome",
      409
    );
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

  if (
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    throw createServiceError(
      "Rating must be a whole number between 1 and 5",
      400
    );
  }

  const meeting = await getParticipantMeeting(meetingId, userId);

  if (meeting.status !== "COMPLETED") {
    throw createServiceError(
      "Feedback is available only after a completed meeting",
      409
    );
  }

  if (
    meeting.feedback.some(
      (entry) => entry.authorId === Number(userId)
    )
  ) {
    throw createServiceError(
      "You already submitted feedback for this meeting",
      409
    );
  }

  return prisma.feedback.create({
    data: {
      meetingId: meeting.id,
      authorId: Number(userId),
      answers: {
        rating: numericRating,
        text:
          typeof text === "string"
            ? text.trim().slice(0, 1000)
            : "",
      },
    },
  });
}

module.exports = {
  createMeetingFromSlot,
  cancelMeeting,
  requestMeetingReschedule,
  confirmMeetingOutcome,
  submitMeetingFeedback,
};
