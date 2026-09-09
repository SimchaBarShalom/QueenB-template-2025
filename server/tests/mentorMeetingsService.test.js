jest.mock("../lib/prisma", () => ({
  mentoringRequest: {
    findFirst: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
  },
  meeting: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  notification: {
    create: jest.fn(),
  },
  meetingOutcomeConfirmation: {
    create: jest.fn(),
  },
  feedback: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
}));

jest.mock("../services/emailService");
jest.mock("../queues/emailQueue", () => ({ emailQueue: { add: jest.fn().mockResolvedValue() } }));
jest.mock("../services/googleCalendarService", () => ({
  isConnected: jest.fn().mockResolvedValue(true),
  createCalendarEvent: jest.fn().mockResolvedValue({ id: "evt-1", calendarLink: "https://calendar.example.com/evt-1", meetLink: "https://meet.example.com/evt-1" }),
}));

const prisma = require("../lib/prisma");
const meetingsService = require("../services/meetingsService");

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function mockTransaction() {
  prisma.$transaction.mockImplementation(async (callback) =>
    callback({
      mentoringRequest: {
        count: prisma.mentoringRequest.count,
        updateMany: prisma.mentoringRequest.updateMany,
        update: prisma.mentoringRequest.update,
      },
      meeting: {
        create: prisma.meeting.create,
        update: prisma.meeting.update,
        findUnique: prisma.meeting.findUnique,
      },
      notification: {
        create: prisma.notification.create,
      },
      meetingOutcomeConfirmation: {
        create: prisma.meetingOutcomeConfirmation.create,
      },
    })
  );
}

function makeSelectableRequest(overrides = {}) {
  const startTime = hoursFromNow(24);
  const endTime = hoursFromNow(25);

  return {
    id: 10,
    menteeId: 2,
    status: "WAITING_FOR_MENTEE_SELECTION",
    mentee: { id: 2, fullName: "Mentee", email: "mentee@example.com" },
    mentorProfile: {
      id: 3,
      userId: 4,
      meetingCapacity: 3,
      user: { id: 4, fullName: "Mentor", email: "mentor@example.com" },
    },
    schedulingRounds: [
      {
        roundNumber: 2,
        offeredSlots: [{ id: 50, startTime, endTime }],
      },
    ],
    meetings: [],
    ...overrides,
  };
}

function makeMeeting(overrides = {}) {
  return {
    id: 7,
    requestId: 10,
    status: "SCHEDULED",
    scheduledEnd: hoursFromNow(-1),
    outcomeConfirmations: [],
    feedback: [],
    request: {
      menteeId: 2,
      mentee: { id: 2, fullName: "Mentee" },
      mentorProfile: {
        userId: 4,
        user: { id: 4, fullName: "Mentor" },
        mentoringTopics: [],
      },
    },
    ...overrides,
  };
}

describe("meetingsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction();
  });

  describe("createMeetingFromSlot", () => {
    it("requires a request waiting for the mentee's time selection", async () => {
      prisma.mentoringRequest.findFirst.mockResolvedValue(null);

      await expect(
        meetingsService.createMeetingFromSlot({ requestId: 10, slotId: 50, menteeId: 2 })
      ).rejects.toMatchObject({
        message: "This request is not waiting for your time selection",
        statusCode: 409,
      });

      expect(prisma.mentoringRequest.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 10,
            menteeId: 2,
            status: "WAITING_FOR_MENTEE_SELECTION",
          },
        })
      );
    });

    it("rejects a slot that is not part of the latest offer", async () => {
      prisma.mentoringRequest.findFirst.mockResolvedValue(
        makeSelectableRequest({
          schedulingRounds: [
            {
              roundNumber: 2,
              offeredSlots: [{ id: 80, startTime: hoursFromNow(24), endTime: hoursFromNow(25) }],
            },
            {
              roundNumber: 1,
              offeredSlots: [{ id: 50, startTime: hoursFromNow(26), endTime: hoursFromNow(27) }],
            },
          ],
        })
      );

      await expect(
        meetingsService.createMeetingFromSlot({ requestId: 10, slotId: 50, menteeId: 2 })
      ).rejects.toMatchObject({
        message: "The selected time is not part of the latest offer",
        statusCode: 400,
      });
    });

    it("rejects a slot that has already started", async () => {
      prisma.mentoringRequest.findFirst.mockResolvedValue(
        makeSelectableRequest({
          schedulingRounds: [
            {
              roundNumber: 1,
              offeredSlots: [
                { id: 50, startTime: hoursFromNow(-1), endTime: hoursFromNow(1) },
              ],
            },
          ],
        })
      );

      await expect(
        meetingsService.createMeetingFromSlot({ requestId: 10, slotId: 50, menteeId: 2 })
      ).rejects.toMatchObject({
        message: "The selected time is no longer available",
        statusCode: 409,
      });
    });

    it("blocks selecting a slot when the mentee already has an active meeting", async () => {
      prisma.mentoringRequest.findFirst.mockResolvedValue(makeSelectableRequest());
      prisma.meeting.findFirst.mockResolvedValue({ id: 1 });

      await expect(
        meetingsService.createMeetingFromSlot({ requestId: 10, slotId: 50, menteeId: 2 })
      ).rejects.toMatchObject({
        message: "יש לך כבר פגישה פעילה. כדי לקבוע פגישה חדשה, בטלי קודם את הפגישה הקיימת.",
        statusCode: 409,
      });

      expect(prisma.meeting.findFirst).toHaveBeenCalledWith({
        where: {
          status: { in: ["SCHEDULED", "ATTENDANCE_CONFIRMED"] },
          request: { is: { menteeId: 2 } },
        },
        select: { id: true },
      });
    });

    it("counts capacity excluding the current request and rejects when the mentor is full", async () => {
      prisma.mentoringRequest.findFirst.mockResolvedValue(makeSelectableRequest());
      prisma.meeting.findFirst.mockResolvedValue(null);
      prisma.mentoringRequest.count.mockResolvedValue(3);

      await expect(
        meetingsService.createMeetingFromSlot({ requestId: 10, slotId: 50, menteeId: 2 })
      ).rejects.toMatchObject({
        message: "המנטורית הגיעה למכסת הפגישות שלה",
        statusCode: 409,
      });

      expect(prisma.mentoringRequest.count).toHaveBeenCalledWith({
        where: {
          mentorProfileId: 3,
          status: {
            in: ["MATCHED", "ATTENDANCE_CONFIRMED", "COMPLETED", "FEEDBACK_COMPLETED"],
          },
          id: { not: 10 },
        },
      });
    });

    it("matches the request, increments attemptNumber, and notifies the mentor", async () => {
      const request = makeSelectableRequest({
        meetings: [{ attemptNumber: 1 }],
      });
      const selectedSlot = request.schedulingRounds[0].offeredSlots[0];
      const createdMeeting = {
        id: 70,
        requestId: 10,
        selectedSlotId: 50,
        attemptNumber: 2,
        scheduledStart: selectedSlot.startTime,
        scheduledEnd: selectedSlot.endTime,
        status: "SCHEDULED",
      };

      prisma.mentoringRequest.findFirst.mockResolvedValue(request);
      prisma.meeting.findFirst.mockResolvedValue(null);
      prisma.mentoringRequest.count.mockResolvedValue(0);
      prisma.mentoringRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.meeting.create.mockResolvedValue(createdMeeting);
      prisma.meeting.update.mockResolvedValue(createdMeeting);
      prisma.notification.create.mockResolvedValue({ id: 1 });

      const result = await meetingsService.createMeetingFromSlot({
        requestId: 10,
        slotId: 50,
        menteeId: 2,
      });

      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
        isolationLevel: "Serializable",
      });
      expect(prisma.mentoringRequest.updateMany).toHaveBeenCalledWith({
        where: { id: 10, status: "WAITING_FOR_MENTEE_SELECTION" },
        data: { status: "MATCHED" },
      });
      expect(prisma.meeting.create).toHaveBeenCalledWith({
        data: {
          requestId: 10,
          selectedSlotId: 50,
          attemptNumber: 2,
          scheduledStart: selectedSlot.startTime,
          scheduledEnd: selectedSlot.endTime,
          status: "SCHEDULED",
        },
      });
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          recipientId: 4,
          requestId: 10,
          meetingId: 70,
          type: "MEETING_MATCHED",
          channel: "IN_APP",
        },
      });
      expect(result).toEqual(createdMeeting);
    });
  });

  describe("confirmMeetingOutcome", () => {
    it("returns 404 when a third party confirms a meeting outcome", async () => {
      prisma.meeting.findFirst.mockResolvedValue(null);

      await expect(
        meetingsService.confirmMeetingOutcome({ meetingId: 7, userId: 99, occurred: true })
      ).rejects.toMatchObject({
        message: "Meeting not found",
        statusCode: 404,
      });

      expect(prisma.meeting.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 7,
            OR: [
              { request: { menteeId: 99 } },
              { request: { mentorProfile: { userId: 99 } } },
            ],
          },
        })
      );
    });

    it("rejects a non-boolean occurred value", async () => {
      await expect(
        meetingsService.confirmMeetingOutcome({ meetingId: 7, userId: 2, occurred: "true" })
      ).rejects.toMatchObject({
        message: "occurred must be true or false",
        statusCode: 400,
      });

      expect(prisma.meeting.findFirst).not.toHaveBeenCalled();
    });

    it("rejects confirming a meeting that has not ended", async () => {
      prisma.meeting.findFirst.mockResolvedValue(
        makeMeeting({ scheduledEnd: hoursFromNow(1) })
      );

      await expect(
        meetingsService.confirmMeetingOutcome({ meetingId: 7, userId: 2, occurred: true })
      ).rejects.toMatchObject({
        message: "The meeting outcome can only be confirmed after it ends",
        statusCode: 409,
      });
    });

    it("rejects a second confirmation from the same participant", async () => {
      prisma.meeting.findFirst.mockResolvedValue(
        makeMeeting({
          outcomeConfirmations: [{ userId: 2, occurred: true }],
        })
      );

      await expect(
        meetingsService.confirmMeetingOutcome({ meetingId: 7, userId: 2, occurred: false })
      ).rejects.toMatchObject({
        message: "You already confirmed this meeting outcome",
        statusCode: 409,
      });
    });

    it("lets the first confirmation set the meeting status", async () => {
      const meeting = makeMeeting({ status: "SCHEDULED" });
      const updatedMeeting = { ...meeting, status: "COMPLETED" };

      prisma.meeting.findFirst.mockResolvedValue(meeting);
      prisma.meetingOutcomeConfirmation.create.mockResolvedValue({ id: 1 });
      prisma.meeting.update.mockResolvedValue(updatedMeeting);
      prisma.mentoringRequest.update.mockResolvedValue({ id: 10, status: "COMPLETED" });
      prisma.meeting.findUnique.mockResolvedValue(updatedMeeting);

      await meetingsService.confirmMeetingOutcome({
        meetingId: 7,
        userId: 2,
        occurred: true,
      });

      expect(prisma.meeting.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: { status: "COMPLETED" },
      });
      expect(prisma.mentoringRequest.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { status: "COMPLETED" },
      });
    });

    it("does not change status when a later confirmation disagrees", async () => {
      const meeting = makeMeeting({
        status: "COMPLETED",
        outcomeConfirmations: [{ userId: 2, occurred: true }],
      });

      prisma.meeting.findFirst.mockResolvedValue(meeting);
      prisma.meetingOutcomeConfirmation.create.mockResolvedValue({ id: 2 });
      prisma.meeting.findUnique.mockResolvedValue(meeting);

      await meetingsService.confirmMeetingOutcome({
        meetingId: 7,
        userId: 4,
        occurred: false,
      });

      expect(prisma.meetingOutcomeConfirmation.create).toHaveBeenCalledWith({
        data: {
          meetingId: 7,
          userId: 4,
          occurred: false,
          wantsReschedule: false,
        },
      });
      expect(prisma.meeting.update).not.toHaveBeenCalled();
      expect(prisma.mentoringRequest.update).not.toHaveBeenCalled();
    });
  });

  describe("submitMeetingFeedback", () => {
    it("rejects a rating that is not an integer between 1 and 5", async () => {
      await expect(
        meetingsService.submitMeetingFeedback({ meetingId: 7, userId: 2, rating: 3.5 })
      ).rejects.toMatchObject({
        message: "Rating must be a whole number between 1 and 5",
        statusCode: 400,
      });

      await expect(
        meetingsService.submitMeetingFeedback({ meetingId: 7, userId: 2, rating: 0 })
      ).rejects.toMatchObject({
        message: "Rating must be a whole number between 1 and 5",
        statusCode: 400,
      });

      await expect(
        meetingsService.submitMeetingFeedback({ meetingId: 7, userId: 2, rating: 6 })
      ).rejects.toMatchObject({
        message: "Rating must be a whole number between 1 and 5",
        statusCode: 400,
      });

      expect(prisma.meeting.findFirst).not.toHaveBeenCalled();
    });

    it("rejects feedback unless the meeting is completed", async () => {
      prisma.meeting.findFirst.mockResolvedValue(makeMeeting({ status: "SCHEDULED" }));

      await expect(
        meetingsService.submitMeetingFeedback({ meetingId: 7, userId: 2, rating: 5 })
      ).rejects.toMatchObject({
        message: "Feedback is available only after a completed meeting",
        statusCode: 409,
      });
    });

    it("rejects a second feedback submission from the same author", async () => {
      prisma.meeting.findFirst.mockResolvedValue(
        makeMeeting({
          status: "COMPLETED",
          feedback: [{ authorId: 2 }],
        })
      );

      await expect(
        meetingsService.submitMeetingFeedback({ meetingId: 7, userId: 2, rating: 4 })
      ).rejects.toMatchObject({
        message: "You already submitted feedback for this meeting",
        statusCode: 409,
      });
    });

    it("trims feedback text to 1000 characters", async () => {
      prisma.meeting.findFirst.mockResolvedValue(
        makeMeeting({ status: "COMPLETED", feedback: [] })
      );
      prisma.feedback.create.mockResolvedValue({ id: 1 });

      const longText = `  ${"x".repeat(1002)}  `;

      await meetingsService.submitMeetingFeedback({
        meetingId: 7,
        userId: 2,
        rating: 5,
        text: longText,
      });

      expect(prisma.feedback.create).toHaveBeenCalledWith({
        data: {
          meetingId: 7,
          authorId: 2,
          answers: {
            rating: 5,
            text: "x".repeat(1000),
          },
        },
      });
    });
  });
});
