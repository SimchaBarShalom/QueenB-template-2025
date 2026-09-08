const prisma = require("../lib/prisma");
const { countUsedCapacity } = require("../lib/capacity");
const { sendEmail } = require("./emailService");

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

async function sendMeetingScheduledEmails({ mentor, mentee, meeting }) {
  try {
    const meetingDate = new Date(meeting.scheduledStart).toLocaleDateString(
      "he-IL",
      { timeZone: "Asia/Jerusalem" }
    );
    const timeOptions = {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jerusalem",
    };
    const startTime = new Date(meeting.scheduledStart).toLocaleTimeString(
      "he-IL",
      timeOptions
    );
    const endTime = new Date(meeting.scheduledEnd).toLocaleTimeString(
      "he-IL",
      timeOptions
    );

    const results = await Promise.allSettled([
      sendEmail({
        to: mentor.email,
        subject: "נקבעה פגישה חדשה ב-Queen Match",
        text: `
היי ${mentor.fullName},

${mentee.fullName} בחרה מועד לפגישה, והפגישה נקבעה בהצלחה.

תאריך הפגישה: ${meetingDate}
שעת התחלה: ${startTime}
שעת סיום: ${endTime}

צוות Queen Match
        `,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>נקבעה פגישה חדשה 🎉</h2>
            <p>היי ${mentor.fullName},</p>
            <p><strong>${mentee.fullName}</strong> בחרה מועד לפגישה, והפגישה נקבעה בהצלחה.</p>
            <p>
              <strong>תאריך הפגישה:</strong> ${meetingDate}<br />
              <strong>שעת התחלה:</strong> ${startTime}<br />
              <strong>שעת סיום:</strong> ${endTime}
            </p>
            <p>צוות Queen Match</p>
          </div>
        `,
      }),
      sendEmail({
        to: mentee.email,
        subject: "הפגישה שלך נקבעה ב-Queen Match",
        text: `
היי ${mentee.fullName},

הפגישה שלך עם ${mentor.fullName} נקבעה בהצלחה.

תאריך הפגישה: ${meetingDate}
שעת התחלה: ${startTime}
שעת סיום: ${endTime}

צוות Queen Match
        `,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>הפגישה שלך נקבעה 🎉</h2>
            <p>היי ${mentee.fullName},</p>
            <p>הפגישה שלך עם <strong>${mentor.fullName}</strong> נקבעה בהצלחה.</p>
            <p>
              <strong>תאריך הפגישה:</strong> ${meetingDate}<br />
              <strong>שעת התחלה:</strong> ${startTime}<br />
              <strong>שעת סיום:</strong> ${endTime}
            </p>
            <p>צוות Queen Match</p>
          </div>
        `,
      }),
    ]);

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `שליחת המייל ${index === 0 ? "למנטורית" : "למנטית"} על קביעת הפגישה נכשלה:`,
          result.reason
        );
      }
    });
  } catch (error) {
    console.error("שגיאה בשליחת מיילים על קביעת הפגישה:", error);
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
      capacityOverride: true,
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

  const meeting = await prisma.$transaction(
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

  await sendMeetingScheduledEmails({
    mentor: request.mentorProfile.user,
    mentee: request.mentee,
    meeting,
  });

  return meeting;
}

async function cancelMeeting({ meetingId, menteeId }) {
  const meeting = await prisma.meeting.findFirst({
    where: {
      id: Number(meetingId),
      status: { in: ["SCHEDULED", "ATTENDANCE_CONFIRMED"] },
      request: { is: { menteeId: Number(menteeId) } },
    },
    include: { request: true },
  });

  if (!meeting) {
    throw createServiceError("Meeting cannot be cancelled", 409);
  }

  return prisma.$transaction(async (transaction) => {
    const updatedMeeting = await transaction.meeting.update({
      where: { id: meeting.id },
      data: { status: "CANCELLED" },
    });

    await transaction.mentoringRequest.update({
      where: { id: meeting.requestId },
      data: { status: "CANCELLED" },
    });

    return updatedMeeting;
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
  confirmMeetingOutcome,
  submitMeetingFeedback,
};
