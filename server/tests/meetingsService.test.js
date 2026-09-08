jest.mock("../lib/prisma", () => ({
  meeting: { findFirst: jest.fn(), update: jest.fn() },
  mentoringRequest: { update: jest.fn(), updateMany: jest.fn(), findUnique: jest.fn() },
  schedulingRound: { create: jest.fn() },
  notification: { create: jest.fn() },
  $transaction: jest.fn(),
}));

const prisma = require("../lib/prisma");
const { cancelMeeting, requestMeetingReschedule } = require("../services/meetingsService");

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
});
