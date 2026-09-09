jest.mock("../lib/prisma", () => ({
  meeting: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn(), count: jest.fn() },
  mentoringRequest: { findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn(), findUnique: jest.fn() },
  schedulingRound: { create: jest.fn() },
  notification: { create: jest.fn() },
  $transaction: jest.fn(),
}));

jest.mock("../queues/emailQueue", () => ({ emailQueue: { add: jest.fn().mockResolvedValue() } }));

jest.mock("../services/googleCalendarService", () => ({
  isConnected: jest.fn().mockResolvedValue(true),
  createCalendarEvent: jest.fn().mockResolvedValue({ id: "evt-1", calendarLink: "https://calendar.example.com/evt-1", meetLink: "https://meet.example.com/evt-1" }),
}));

const prisma = require("../lib/prisma");
const { emailQueue } = require("../queues/emailQueue");
const { createMeetingFromSlot, cancelMeeting, requestMeetingReschedule } = require("../services/meetingsService");

describe("scheduled-meeting participant actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback({
      meeting: prisma.meeting,
      mentoringRequest: prisma.mentoringRequest,
      schedulingRound: prisma.schedulingRound,
      notification: prisma.notification,
    }));
  });

  it.each([
    ["mentee", 11],
    ["mentor", 22],
  ])("allows the %s participant to cancel", async (_role, userId) => {
    prisma.meeting.findFirst.mockResolvedValue({ id: 7, requestId: 4 });
    prisma.meeting.update.mockResolvedValue({ id: 7, status: "CANCELLED" });

    await cancelMeeting({ meetingId: 7, userId });

    expect(prisma.meeting.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        OR: [
          { request: { menteeId: userId } },
          { request: { mentorProfile: { userId } } },
        ],
      }),
    }));
    expect(prisma.meeting.update).toHaveBeenCalledWith({ where: { id: 7 }, data: { status: "CANCELLED" } });
  });

  it("rejects cancellation by a non-participant", async () => {
    prisma.meeting.findFirst.mockResolvedValue(null);
    await expect(cancelMeeting({ meetingId: 7, userId: 99 })).rejects.toThrow("Meeting cannot be cancelled");
  });

  it("enqueues a meeting-cancelled email job with a deterministic jobId when the mentor cancels", async () => {
    const scheduledStart = new Date(Date.now() + 60 * 60 * 1000);
    prisma.meeting.findFirst.mockResolvedValue({
      id: 7,
      requestId: 4,
      scheduledStart,
      request: {
        mentee: { id: 11, fullName: "Mentee", email: "mentee@example.com" },
        mentorProfile: { user: { id: 22, fullName: "Mentor", email: "mentor@example.com" } },
      },
    });
    prisma.meeting.update.mockResolvedValue({ id: 7, status: "CANCELLED" });

    await cancelMeeting({ meetingId: 7, userId: 22 });

    expect(emailQueue.add).toHaveBeenCalledWith(
      "meeting-cancelled",
      expect.objectContaining({
        to: "mentee@example.com",
        menteeName: "Mentee",
        mentorName: "Mentor",
        scheduledStart,
      }),
      expect.objectContaining({
        jobId: "meeting-cancelled-7",
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
      })
    );
  });

  it("does not fail cancellation when enqueueing the email job fails", async () => {
    emailQueue.add.mockRejectedValueOnce(new Error("Redis unavailable"));
    prisma.meeting.findFirst.mockResolvedValue({
      id: 7,
      requestId: 4,
      scheduledStart: new Date(),
      request: {
        mentee: { id: 11, fullName: "Mentee", email: "mentee@example.com" },
        mentorProfile: { user: { id: 22, fullName: "Mentor", email: "mentor@example.com" } },
      },
    });
    prisma.meeting.update.mockResolvedValue({ id: 7, status: "CANCELLED" });

    await expect(cancelMeeting({ meetingId: 7, userId: 22 })).resolves.toEqual({ id: 7, status: "CANCELLED" });
  });

  it("does not enqueue a cancellation email when the mentee cancels", async () => {
    prisma.meeting.findFirst.mockResolvedValue({
      id: 7,
      requestId: 4,
      scheduledStart: new Date(),
      request: {
        mentee: { id: 11, fullName: "Mentee", email: "mentee@example.com" },
        mentorProfile: { user: { id: 22, fullName: "Mentor", email: "mentor@example.com" } },
      },
    });
    prisma.meeting.update.mockResolvedValue({ id: 7, status: "CANCELLED" });

    await cancelMeeting({ meetingId: 7, userId: 11 });

    expect(emailQueue.add).not.toHaveBeenCalled();
  });

  it("allows a mentee participant to request rescheduling and notifies only her mentor", async () => {
    prisma.meeting.findFirst.mockResolvedValue({
      id: 7,
      requestId: 4,
      scheduledStart: new Date(Date.now() + 60 * 60 * 1000),
      request: { mentorProfile: { userId: 22 }, schedulingRounds: [{ roundNumber: 1, type: "INITIAL" }] },
    });
    prisma.mentoringRequest.updateMany.mockResolvedValue({ count: 1 });
    prisma.mentoringRequest.findUnique.mockResolvedValue({ id: 4, status: "WAITING_FOR_MENTOR_SLOTS" });

    await requestMeetingReschedule({ meetingId: 7, userId: 11 });

    expect(prisma.mentoringRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 4, status: { in: ["MATCHED", "ATTENDANCE_CONFIRMED"] } },
    }));
    expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ recipientId: 22, type: "RESCHEDULE_REQUIRED" }),
    }));
  });

  it("creates exactly one meeting when a mentee selects a proposed slot", async () => {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    prisma.mentoringRequest.findFirst.mockResolvedValue({
      id: 4,
      capacityOverride: true,
      mentee: { id: 11, fullName: "Mentee", email: "mentee@example.com" },
      mentorProfile: { id: 3, userId: 22, meetingCapacity: 2, user: { fullName: "Mentor", email: "mentor@example.com" } },
      schedulingRounds: [{ offeredSlots: [{ id: 9, startTime: start, endTime: end }] }],
      meetings: [],
    });
    prisma.meeting.findFirst.mockResolvedValue(null);
    prisma.mentoringRequest.updateMany.mockResolvedValue({ count: 1 });
    prisma.meeting.create.mockResolvedValue({ id: 7, requestId: 4, status: "SCHEDULED", scheduledStart: start, scheduledEnd: end });
    prisma.meeting.update.mockResolvedValue({ id: 7, requestId: 4, status: "SCHEDULED", scheduledStart: start, scheduledEnd: end });

    const result = await createMeetingFromSlot({ requestId: 4, slotId: 9, menteeId: 11 });

    expect(result.id).toBe(7);
    expect(prisma.meeting.create).toHaveBeenCalledTimes(1);
    expect(prisma.meeting.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ requestId: 4, selectedSlotId: 9, status: "SCHEDULED" }),
    }));
    expect(emailQueue.add).toHaveBeenCalledWith(
      "meeting-scheduled-mentor",
      expect.objectContaining({ to: "mentor@example.com", mentorName: "Mentor", menteeName: "Mentee" }),
      expect.objectContaining({ jobId: "meeting-scheduled-mentor-7", attempts: 3 })
    );
    expect(emailQueue.add).toHaveBeenCalledWith(
      "meeting-scheduled-mentee",
      expect.objectContaining({ to: "mentee@example.com", mentorName: "Mentor", menteeName: "Mentee" }),
      expect.objectContaining({ jobId: "meeting-scheduled-mentee-7", attempts: 3 })
    );
  });

  it("still creates the meeting successfully when enqueueing the scheduled-meeting emails fails", async () => {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    emailQueue.add.mockRejectedValue(new Error("Redis unavailable"));
    prisma.mentoringRequest.findFirst.mockResolvedValue({
      id: 4,
      capacityOverride: true,
      mentee: { id: 11, fullName: "Mentee", email: "mentee@example.com" },
      mentorProfile: { id: 3, userId: 22, meetingCapacity: 2, user: { fullName: "Mentor", email: "mentor@example.com" } },
      schedulingRounds: [{ offeredSlots: [{ id: 9, startTime: start, endTime: end }] }],
      meetings: [],
    });
    prisma.meeting.findFirst.mockResolvedValue(null);
    prisma.mentoringRequest.updateMany.mockResolvedValue({ count: 1 });
    prisma.meeting.create.mockResolvedValue({ id: 7, requestId: 4, status: "SCHEDULED", scheduledStart: start, scheduledEnd: end });
    prisma.meeting.update.mockResolvedValue({ id: 7, requestId: 4, status: "SCHEDULED", scheduledStart: start, scheduledEnd: end });

    const result = await createMeetingFromSlot({ requestId: 4, slotId: 9, menteeId: 11 });

    expect(result.id).toBe(7);
  });
});
