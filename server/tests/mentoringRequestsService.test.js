jest.mock("../lib/prisma", () => ({
  user: {
    findUnique: jest.fn(),
  },
  mentorProfile: {
    findUnique: jest.fn(),
  },
  meeting: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  mentoringRequest: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  schedulingRound: {
    create: jest.fn(),
  },
  notification: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
}));

jest.mock("../services/emailService", () => ({
  sendEmail: jest.fn(),
}));

jest.mock("../services/meetingsService", () => ({
  createMeetingFromSlot: jest.fn(),
}));

const prisma = require("../lib/prisma");
const { sendEmail } = require("../services/emailService");
const { createMeetingFromSlot } = require("../services/meetingsService");
const mentoringRequestsService = require("../services/mentoringRequestsService");

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * HOUR_MS);
}

function slotAt(start, durationMinutes = 60) {
  const startTime = start instanceof Date ? start : new Date(start);
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
  return {
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
  };
}

function mockTransaction() {
  prisma.$transaction.mockImplementation(async (callback) =>
    callback({
      mentoringRequest: {
        count: prisma.mentoringRequest.count,
        updateMany: prisma.mentoringRequest.updateMany,
        update: prisma.mentoringRequest.update,
        findUnique: prisma.mentoringRequest.findUnique,
      },
      meeting: {
        create: prisma.meeting.create,
        update: prisma.meeting.update,
      },
      schedulingRound: {
        create: prisma.schedulingRound.create,
      },
      notification: {
        create: prisma.notification.create,
      },
    })
  );
}

function mockPendingRequest({
  schedulingRounds = [],
  meetingCapacity = 5,
  meetingDurationMinutes = 60,
  usedCapacity = 0,
} = {}) {
  prisma.mentoringRequest.findFirst.mockResolvedValue({
    id: 10,
    menteeId: 2,
    status: "WAITING_FOR_MENTOR_SLOTS",
    mentorProfile: {
      id: 3,
      meetingDurationMinutes,
      meetingCapacity,
    },
    schedulingRounds,
  });
  prisma.mentoringRequest.count.mockResolvedValue(usedCapacity);
}

describe("mentoringRequestsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction();
  });

  describe("createMentoringRequest", () => {
    it("blocks a new request when the mentee already has an active meeting", async () => {
      prisma.meeting.findFirst.mockResolvedValue({ id: 7 });

      await expect(mentoringRequestsService.createMentoringRequest({ menteeId: 2, mentorProfileId: 3 })).rejects.toMatchObject({
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
      expect(prisma.mentoringRequest.create).not.toHaveBeenCalled();
    });

    it("blocks a duplicate active request to the same mentor", async () => {
      prisma.meeting.findFirst.mockResolvedValue(null);
      prisma.mentoringRequest.findFirst.mockResolvedValue({ id: 5 });

      await expect(mentoringRequestsService.createMentoringRequest({ menteeId: 2, mentorProfileId: 3 })).rejects.toMatchObject({
        message: "כבר קיימת בקשה פעילה עם מנטורית זו",
        statusCode: 409,
      });

      expect(prisma.mentoringRequest.findFirst).toHaveBeenCalledWith({
        where: {
          menteeId: 2,
          mentorProfileId: 3,
          status: {
            in: ["WAITING_FOR_MENTOR_SLOTS", "WAITING_FOR_MENTEE_SELECTION", "MATCHED", "ATTENDANCE_CONFIRMED"],
          },
        },
        select: { id: true },
      });
      expect(prisma.mentoringRequest.create).not.toHaveBeenCalled();
    });

    it("blocks a new request after a same-month cancel with extra slots and a reschedule notification", async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      prisma.meeting.findFirst.mockResolvedValue(null);
      prisma.mentoringRequest.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 99 });

      await expect(mentoringRequestsService.createMentoringRequest({ menteeId: 2, mentorProfileId: 3 })).rejects.toMatchObject({
        message: "לא ניתן לקבוע פגישה חדשה עם מנטורית זו עד החודש הבא",
        statusCode: 409,
      });

      expect(prisma.mentoringRequest.findFirst).toHaveBeenNthCalledWith(2, {
        where: {
          menteeId: 2,
          mentorProfileId: 3,
          status: "CANCELLED",
          updatedAt: { gte: monthStart, lt: monthEnd },
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
      expect(prisma.mentoringRequest.create).not.toHaveBeenCalled();
    });

    it("still creates the request when sending emails fails", async () => {
      const created = { id: 10, menteeId: 2, mentorProfileId: 3, status: "WAITING_FOR_MENTOR_SLOTS" };
      prisma.meeting.findFirst.mockResolvedValue(null);
      prisma.mentoringRequest.findFirst.mockResolvedValue(null);
      prisma.mentoringRequest.create.mockResolvedValue(created);
      prisma.user.findUnique.mockResolvedValue({ fullName: "Mentee", email: "mentee@example.com" });
      prisma.mentorProfile.findUnique.mockResolvedValue({
        mentoringTopics: [{ name: "React" }],
        user: { fullName: "Mentor", email: "mentor@example.com" },
      });
      sendEmail.mockRejectedValue(new Error("SMTP down"));
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      try {
        const result = await mentoringRequestsService.createMentoringRequest({ menteeId: 2, mentorProfileId: 3 });

        expect(result).toEqual(created);
        expect(prisma.mentoringRequest.create).toHaveBeenCalledWith({
          data: {
            menteeId: 2,
            mentorProfileId: 3,
            status: "WAITING_FOR_MENTOR_SLOTS",
          },
        });
        expect(sendEmail).toHaveBeenCalled();
      } finally {
        errorSpy.mockRestore();
      }
    });
  });

  describe("getMentoringRequestsByMentorUser", () => {
    it("throws 403 when the user has no mentor profile", async () => {
      prisma.mentorProfile.findUnique.mockResolvedValue(null);

      await expect(mentoringRequestsService.getMentoringRequestsByMentorUser(4)).rejects.toMatchObject({
        message: "Only mentors can access mentor meetings",
        statusCode: 403,
      });

      expect(prisma.mentoringRequest.findMany).not.toHaveBeenCalled();
    });
  });

  describe("offerMentoringRequestSlots", () => {
    it("enforces the capacity gate before slot validation", async () => {
      mockPendingRequest({ meetingCapacity: 2, usedCapacity: 2 });

      await expect(
        mentoringRequestsService.offerMentoringRequestSlots({
          requestId: 10,
          userId: 4,
          slots: [],
        })
      ).rejects.toMatchObject({
        message: "הגעת למכסת הפגישות שלך",
        statusCode: 409,
      });

      expect(prisma.mentoringRequest.count).toHaveBeenCalledWith({
        where: {
          mentorProfileId: 3,
          status: { in: ["MATCHED", "ATTENDANCE_CONFIRMED", "COMPLETED", "FEEDBACK_COMPLETED"] },
        },
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("rejects fewer than 1 or more than 10 slots", async () => {
      mockPendingRequest();

      await expect(
        mentoringRequestsService.offerMentoringRequestSlots({
          requestId: 10,
          userId: 4,
          slots: [],
        })
      ).rejects.toMatchObject({
        message: "Provide between 1 and 10 time slots",
        statusCode: 400,
      });

      mockPendingRequest();
      await expect(
        mentoringRequestsService.offerMentoringRequestSlots({
          requestId: 10,
          userId: 4,
          slots: Array.from({ length: 11 }, () => ({})),
        })
      ).rejects.toMatchObject({
        message: "Provide between 1 and 10 time slots",
        statusCode: 400,
      });
    });

    it("rejects slots that start in the past or at the current time", async () => {
      const now = Date.now();
      const nowSpy = jest.spyOn(Date, "now").mockReturnValue(now);

      try {
        mockPendingRequest();
        await expect(
          mentoringRequestsService.offerMentoringRequestSlots({
            requestId: 10,
            userId: 4,
            slots: [slotAt(new Date(now - 60 * 1000))],
          })
        ).rejects.toMatchObject({
          message: "Every slot must have a valid future start and end time",
          statusCode: 400,
        });

        mockPendingRequest();
        await expect(
          mentoringRequestsService.offerMentoringRequestSlots({
            requestId: 10,
            userId: 4,
            slots: [slotAt(new Date(now))],
          })
        ).rejects.toMatchObject({
          message: "Every slot must have a valid future start and end time",
          statusCode: 400,
        });
      } finally {
        nowSpy.mockRestore();
      }
    });

    it("rejects slots that are not exactly the mentor duration", async () => {
      mockPendingRequest({ meetingDurationMinutes: 60 });

      await expect(
        mentoringRequestsService.offerMentoringRequestSlots({
          requestId: 10,
          userId: 4,
          slots: [slotAt(hoursFromNow(24), 45)],
        })
      ).rejects.toMatchObject({
        message: "Every slot must be exactly 60 minutes",
        statusCode: 400,
      });
    });

    it("sorts offered slots by start time before saving", async () => {
      mockPendingRequest();
      prisma.mentoringRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.schedulingRound.create.mockResolvedValue({ id: 1 });
      prisma.mentoringRequest.findUnique.mockResolvedValue({ id: 10, status: "WAITING_FOR_MENTEE_SELECTION" });

      const later = hoursFromNow(48);
      const earlier = hoursFromNow(24);

      await mentoringRequestsService.offerMentoringRequestSlots({
        requestId: 10,
        userId: 4,
        slots: [slotAt(later), slotAt(earlier)],
      });

      const createdSlots = prisma.schedulingRound.create.mock.calls[0][0].data.offeredSlots.create;
      expect(createdSlots).toHaveLength(2);
      expect(createdSlots[0].startTime.getTime()).toBe(earlier.getTime());
      expect(createdSlots[1].startTime.getTime()).toBe(later.getTime());
    });

    it("allows touching slots and rejects overlapping slots", async () => {
      mockPendingRequest();
      prisma.mentoringRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.schedulingRound.create.mockResolvedValue({ id: 1 });
      prisma.mentoringRequest.findUnique.mockResolvedValue({ id: 10, status: "WAITING_FOR_MENTEE_SELECTION" });

      const firstStart = hoursFromNow(24);
      const firstEnd = new Date(firstStart.getTime() + 60 * 60 * 1000);

      await mentoringRequestsService.offerMentoringRequestSlots({
        requestId: 10,
        userId: 4,
        slots: [slotAt(firstStart), slotAt(firstEnd)],
      });

      expect(prisma.schedulingRound.create).toHaveBeenCalled();

      mockPendingRequest();
      const overlappingStart = new Date(firstEnd.getTime() - 1000);
      await expect(
        mentoringRequestsService.offerMentoringRequestSlots({
          requestId: 10,
          userId: 4,
          slots: [slotAt(firstStart), slotAt(overlappingStart)],
        })
      ).rejects.toMatchObject({
        message: "Offered time slots cannot overlap",
        statusCode: 400,
      });
    });

    it("creates round 1 as INITIAL and round 2 as EXTRA_SLOTS", async () => {
      mockPendingRequest({ schedulingRounds: [] });
      prisma.mentoringRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.schedulingRound.create.mockResolvedValue({ id: 1 });
      prisma.mentoringRequest.findUnique.mockResolvedValue({ id: 10 });

      await mentoringRequestsService.offerMentoringRequestSlots({
        requestId: 10,
        userId: 4,
        slots: [slotAt(hoursFromNow(24))],
      });

      expect(prisma.schedulingRound.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          requestId: 10,
          roundNumber: 1,
          type: "INITIAL",
        }),
      });

      mockPendingRequest({ schedulingRounds: [{ roundNumber: 1 }] });
      prisma.mentoringRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.mentoringRequest.findUnique.mockResolvedValue({ id: 10 });

      await mentoringRequestsService.offerMentoringRequestSlots({
        requestId: 10,
        userId: 4,
        slots: [slotAt(hoursFromNow(30))],
      });

      expect(prisma.schedulingRound.create).toHaveBeenLastCalledWith({
        data: expect.objectContaining({
          requestId: 10,
          roundNumber: 2,
          type: "EXTRA_SLOTS",
        }),
      });
    });

    it("throws when the request was already handled", async () => {
      mockPendingRequest();
      prisma.mentoringRequest.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        mentoringRequestsService.offerMentoringRequestSlots({
          requestId: 10,
          userId: 4,
          slots: [slotAt(hoursFromNow(24))],
        })
      ).rejects.toMatchObject({
        message: "This request was already handled",
        statusCode: 409,
      });

      expect(prisma.schedulingRound.create).not.toHaveBeenCalled();
    });
  });

  describe("rejectMentoringRequest", () => {
    it("returns 404 when the request is not owned by the mentor", async () => {
      prisma.mentoringRequest.findFirst.mockResolvedValue(null);

      await expect(mentoringRequestsService.rejectMentoringRequest({ requestId: 10, userId: 4 })).rejects.toMatchObject({
        message: "Mentoring request not found",
        statusCode: 404,
      });

      expect(prisma.mentoringRequest.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 10,
            mentorProfile: { userId: 4 },
          },
        })
      );
      expect(prisma.mentoringRequest.update).not.toHaveBeenCalled();
    });

    it("rejects only from WAITING_FOR_MENTOR_SLOTS", async () => {
      prisma.mentoringRequest.findFirst.mockResolvedValue({
        id: 10,
        status: "WAITING_FOR_MENTEE_SELECTION",
        mentorProfile: { id: 3, meetingDurationMinutes: 60, meetingCapacity: 5 },
        schedulingRounds: [],
      });

      await expect(mentoringRequestsService.rejectMentoringRequest({ requestId: 10, userId: 4 })).rejects.toMatchObject({
        message: "This request is no longer waiting for mentor action",
        statusCode: 409,
      });

      prisma.mentoringRequest.findFirst.mockResolvedValue({
        id: 10,
        status: "WAITING_FOR_MENTOR_SLOTS",
        mentorProfile: { id: 3, meetingDurationMinutes: 60, meetingCapacity: 5 },
        schedulingRounds: [],
      });
      prisma.mentoringRequest.update.mockResolvedValue({ id: 10, status: "REJECTED" });

      const result = await mentoringRequestsService.rejectMentoringRequest({ requestId: 10, userId: 4 });

      expect(prisma.mentoringRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 },
          data: { status: "REJECTED" },
        })
      );
      expect(result.status).toBe("REJECTED");
    });
  });

  describe("offerRescheduleSlots", () => {
    function mockRescheduleRequest(overrides = {}) {
      prisma.mentoringRequest.findFirst.mockResolvedValue({
        id: 10,
        menteeId: 2,
        status: "MATCHED",
        mentorProfile: { meetingDurationMinutes: 60 },
        schedulingRounds: [{ roundNumber: 1, type: "INITIAL" }],
        meetings: [
          {
            id: 20,
            scheduledStart: hoursFromNow(24),
            status: "SCHEDULED",
          },
        ],
        ...overrides,
      });
    }

    it("allows reschedule only once", async () => {
      mockRescheduleRequest({
        schedulingRounds: [
          { roundNumber: 1, type: "INITIAL" },
          { roundNumber: 2, type: "RESCHEDULE_BEFORE_MEETING" },
        ],
      });

      await expect(
        mentoringRequestsService.offerRescheduleSlots({
          requestId: 10,
          userId: 4,
          slots: [slotAt(hoursFromNow(48))],
        })
      ).rejects.toMatchObject({
        message: "The meeting has already been rescheduled once",
        statusCode: 409,
      });
    });

    it("requires a future meeting", async () => {
      mockRescheduleRequest({
        meetings: [
          {
            id: 20,
            scheduledStart: new Date(Date.now() - HOUR_MS),
            status: "SCHEDULED",
          },
        ],
      });

      await expect(
        mentoringRequestsService.offerRescheduleSlots({
          requestId: 10,
          userId: 4,
          slots: [slotAt(hoursFromNow(48))],
        })
      ).rejects.toMatchObject({
        message: "Only an upcoming meeting can be rescheduled",
        statusCode: 409,
      });
    });

    it("marks the old meeting RESCHEDULED and creates a RESCHEDULE_REQUIRED notification", async () => {
      mockRescheduleRequest();
      prisma.mentoringRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.meeting.update.mockResolvedValue({ id: 20, status: "RESCHEDULED" });
      prisma.schedulingRound.create.mockResolvedValue({ id: 2 });
      prisma.notification.create.mockResolvedValue({ id: 1 });
      prisma.mentoringRequest.findUnique.mockResolvedValue({ id: 10, status: "WAITING_FOR_MENTEE_SELECTION" });

      await mentoringRequestsService.offerRescheduleSlots({
        requestId: 10,
        userId: 4,
        slots: [slotAt(hoursFromNow(48))],
      });

      expect(prisma.meeting.update).toHaveBeenCalledWith({
        where: { id: 20 },
        data: { status: "RESCHEDULED" },
      });
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          recipientId: 2,
          requestId: 10,
          meetingId: 20,
          type: "RESCHEDULE_REQUIRED",
          channel: "IN_APP",
        },
      });
      expect(prisma.schedulingRound.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          requestId: 10,
          type: "RESCHEDULE_BEFORE_MEETING",
        }),
      });
    });
  });

  describe("declineOfferedSlots", () => {
    it("returns to WAITING_FOR_MENTOR_SLOTS on the first decline", async () => {
      prisma.mentoringRequest.findFirst.mockResolvedValue({
        id: 10,
        menteeId: 2,
        status: "WAITING_FOR_MENTEE_SELECTION",
        schedulingRounds: [{ type: "INITIAL" }],
        mentorProfile: { userId: 4 },
      });
      prisma.mentoringRequest.update.mockResolvedValue({ id: 10, status: "WAITING_FOR_MENTOR_SLOTS" });
      prisma.notification.create.mockResolvedValue({ id: 1 });
      prisma.mentoringRequest.findUnique.mockResolvedValue({ id: 10, status: "WAITING_FOR_MENTOR_SLOTS" });

      const result = await mentoringRequestsService.declineOfferedSlots({ requestId: 10, menteeId: 2 });

      expect(prisma.mentoringRequest.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { status: "WAITING_FOR_MENTOR_SLOTS" },
      });
      expect(result.status).toBe("WAITING_FOR_MENTOR_SLOTS");
    });

    it("cancels the request on the second decline after extra slots", async () => {
      prisma.mentoringRequest.findFirst.mockResolvedValue({
        id: 10,
        menteeId: 2,
        status: "WAITING_FOR_MENTEE_SELECTION",
        schedulingRounds: [{ type: "INITIAL" }, { type: "EXTRA_SLOTS" }],
        mentorProfile: { userId: 4 },
      });
      prisma.mentoringRequest.update.mockResolvedValue({ id: 10, status: "CANCELLED" });
      prisma.notification.create.mockResolvedValue({ id: 1 });
      prisma.mentoringRequest.findUnique.mockResolvedValue({ id: 10, status: "CANCELLED" });

      const result = await mentoringRequestsService.declineOfferedSlots({ requestId: 10, menteeId: 2 });

      expect(prisma.mentoringRequest.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { status: "CANCELLED" },
      });
      expect(result.status).toBe("CANCELLED");
    });
  });

  describe("cancelMentoringRequest", () => {
    it("cancels only from the two waiting states", async () => {
      prisma.mentoringRequest.findFirst.mockResolvedValue(null);

      await expect(mentoringRequestsService.cancelMentoringRequest({ requestId: 10, menteeId: 2 })).rejects.toMatchObject({
        message: "Mentoring request cannot be cancelled",
        statusCode: 409,
      });

      expect(prisma.mentoringRequest.findFirst).toHaveBeenCalledWith({
        where: {
          id: 10,
          menteeId: 2,
          status: {
            in: ["WAITING_FOR_MENTOR_SLOTS", "WAITING_FOR_MENTEE_SELECTION"],
          },
        },
      });

      prisma.mentoringRequest.findFirst.mockResolvedValue({
        id: 10,
        menteeId: 2,
        status: "WAITING_FOR_MENTOR_SLOTS",
      });
      prisma.mentoringRequest.update.mockResolvedValue({ id: 10, status: "CANCELLED" });

      const result = await mentoringRequestsService.cancelMentoringRequest({ requestId: 10, menteeId: 2 });

      expect(prisma.mentoringRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 },
          data: { status: "CANCELLED" },
        })
      );
      expect(result.status).toBe("CANCELLED");
    });
  });

  describe("selectMentoringRequestSlot", () => {
    it("delegates meeting creation to meetingsService", async () => {
      createMeetingFromSlot.mockResolvedValue({ id: 20 });
      prisma.mentoringRequest.findUnique.mockResolvedValue({ id: 10, status: "MATCHED" });

      const result = await mentoringRequestsService.selectMentoringRequestSlot({
        requestId: 10,
        userId: 2,
        slotId: 7,
      });

      expect(createMeetingFromSlot).toHaveBeenCalledWith({
        requestId: 10,
        slotId: 7,
        menteeId: 2,
      });
      expect(result.status).toBe("MATCHED");
    });
  });
});
