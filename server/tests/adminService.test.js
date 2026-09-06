jest.mock("../lib/prisma", () => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  mentorProfile: {
    count: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  meeting: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  },
  mentoringRequest: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  adminAlertResolution: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
}));

const prisma = require("../lib/prisma");
const adminService = require("../services/adminService");

describe("adminService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("blocks removing admin access from the current admin", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, isAdmin: true });

    await expect(adminService.setUserAdminStatus(1, false, 1)).rejects.toThrow(
      "Cannot remove your own admin access"
    );
  });

  it("blocks removing the last admin", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2, isAdmin: true });
    prisma.user.count.mockResolvedValue(1);

    await expect(adminService.setUserAdminStatus(2, false, 1)).rejects.toThrow("Cannot remove the last admin");
  });

  it("cancels active requests and their active meetings", async () => {
    prisma.mentoringRequest.findUnique.mockResolvedValue({
      id: 9,
      status: "MATCHED",
      meetings: [],
    });
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        meeting: { updateMany: prisma.meeting.updateMany },
        mentoringRequest: { update: prisma.mentoringRequest.update },
      })
    );
    prisma.mentoringRequest.update.mockResolvedValue({ id: 9, status: "CANCELLED" });

    const result = await adminService.cancelAdminRequest(9);

    expect(prisma.meeting.updateMany).toHaveBeenCalledWith({
      where: { requestId: 9, status: { in: ["SCHEDULED", "ATTENDANCE_CONFIRMED"] } },
      data: { status: "CANCELLED" },
    });
    expect(result.status).toBe("CANCELLED");
  });

  it("updates only safe user profile fields and technology relations", async () => {
    const updatedUser = {
      id: 2,
      email: "user@example.com",
      fullName: "Updated User",
      jobTitle: "Developer",
      workplace: null,
      yearsOfExperience: 0,
      githubUrl: null,
      linkedinUrl: "https://linkedin.example/user",
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      technologies: [{ name: "React" }, { name: "Node.js" }],
      mentorProfile: null,
    };
    prisma.user.findUnique.mockResolvedValue({ id: 2 });
    prisma.user.update.mockResolvedValue(updatedUser);
    prisma.user.count.mockResolvedValue(1);

    const result = await adminService.updateUserProfile(
      2,
      {
        fullName: " Updated User ",
        email: "ignored@example.com",
        passwordHash: "ignored",
        jobTitle: " Developer ",
        workplace: "",
        yearsOfExperience: 0,
        linkedinUrl: "https://linkedin.example/user",
        technologies: ["React", "React", "Node.js", ""],
      },
      1
    );

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 2 },
        data: expect.not.objectContaining({ email: expect.anything(), passwordHash: expect.anything() }),
      })
    );
    expect(prisma.user.update.mock.calls[0][0].data).toEqual(
      expect.objectContaining({
        fullName: "Updated User",
        jobTitle: "Developer",
        workplace: null,
        yearsOfExperience: 0,
        technologies: {
          set: [],
          connectOrCreate: [
            { where: { name: "React" }, create: { name: "React" } },
            { where: { name: "Node.js" }, create: { name: "Node.js" } },
          ],
        },
      })
    );
    expect(result.fullName).toBe("Updated User");
    expect(result.technologies).toEqual(["React", "Node.js"]);
  });

  it("updates an existing mentor profile with normalized topics", async () => {
    prisma.mentorProfile.findUnique.mockResolvedValue({ id: 4 });
    prisma.mentorProfile.update.mockResolvedValue({
      id: 4,
      isActive: false,
      background: "Frontend mentoring",
      meetingCapacity: 3,
      meetingDurationMinutes: 60,
      mentoringTopics: [{ name: "CV Review" }, { name: "React" }],
    });

    const result = await adminService.updateMentorProfile(4, {
      background: " Frontend mentoring ",
      meetingCapacity: 3,
      meetingDurationMinutes: 60,
      isActive: false,
      mentoringTopics: ["CV Review", "React", "React"],
    });

    expect(prisma.mentorProfile.update.mock.calls[0][0].data).toEqual(
      expect.objectContaining({
        background: "Frontend mentoring",
        meetingCapacity: 3,
        meetingDurationMinutes: 60,
        isActive: false,
        mentoringTopics: {
          set: [],
          connectOrCreate: [
            { where: { name: "CV Review" }, create: { name: "CV Review" } },
            { where: { name: "React" }, create: { name: "React" } },
          ],
        },
      })
    );
    expect(result.mentoringTopics).toEqual(["CV Review", "React"]);
  });

  it("rejects schedule edits for final meetings", async () => {
    prisma.meeting.findUnique.mockResolvedValue({
      id: 5,
      status: "COMPLETED",
      scheduledEnd: new Date(Date.now() + 60 * 60 * 1000),
    });

    await expect(
      adminService.updateMeetingSchedule(5, {
        scheduledStart: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        scheduledEnd: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      })
    ).rejects.toThrow("Only future active meetings can be rescheduled by admin");
  });

  it("updates a future active meeting schedule and selected slot", async () => {
    const scheduledStart = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const scheduledEnd = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const existingMeeting = {
      id: 5,
      requestId: 8,
      selectedSlotId: 11,
      status: "SCHEDULED",
      scheduledEnd: new Date(Date.now() + 60 * 60 * 1000),
    };
    const updatedMeeting = {
      id: 5,
      requestId: 8,
      attemptNumber: 1,
      selectedSlotId: 11,
      scheduledStart,
      scheduledEnd,
      status: "SCHEDULED",
      createdAt: new Date(),
      updatedAt: new Date(),
      request: {
        status: "MATCHED",
        mentee: { id: 2, fullName: "Mentee", email: "mentee@example.com" },
        mentorProfile: {
          id: 3,
          isActive: true,
          user: { id: 4, fullName: "Mentor", email: "mentor@example.com" },
          mentoringTopics: [{ name: "React" }],
        },
      },
      attendanceConfirmations: [],
      outcomeConfirmations: [],
      feedback: [],
    };

    prisma.meeting.findUnique.mockResolvedValue(existingMeeting);
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        meeting: {
          update: prisma.meeting.updateMany,
          findUnique: jest.fn().mockResolvedValue(updatedMeeting),
        },
        offeredSlot: {
          update: jest.fn(),
        },
      })
    );

    const result = await adminService.updateMeetingSchedule(5, {
      scheduledStart: scheduledStart.toISOString(),
      scheduledEnd: scheduledEnd.toISOString(),
    });

    expect(result.scheduledStart).toBe(scheduledStart);
    expect(result.scheduledEnd).toBe(scheduledEnd);
  });

  it("builds analytics for the selected period without exposing feedback answers", async () => {
    const recentDate = new Date();
    prisma.user.findMany.mockResolvedValue([{ createdAt: recentDate }]);
    prisma.mentoringRequest.findMany.mockResolvedValue([{ createdAt: recentDate }]);
    prisma.meeting.findMany.mockResolvedValue([
      { scheduledStart: recentDate, status: "COMPLETED", feedback: [{ id: 1 }], request: { mentorProfileId: 4 } },
      { scheduledStart: recentDate, status: "NOT_COMPLETED", feedback: [{ id: 2 }], request: { mentorProfileId: 4 } },
    ]);
    prisma.mentorProfile.findMany.mockResolvedValue([
      {
        id: 4,
        user: { fullName: "Mentor" },
        mentoringRequestsReceived: [{ meetings: [{ status: "COMPLETED" }, { status: "NOT_COMPLETED" }] }],
      },
    ]);

    const result = await adminService.getAdminAnalytics({ months: "3" });

    expect(result.period.months).toBe(3);
    expect(result.totals).toEqual(expect.objectContaining({ meetings: 2, completedMeetings: 1, noShowMeetings: 1, feedbackCompletionRate: 100 }));
    expect(result.monthly).toHaveLength(3);
    expect(result.statusBreakdown).toEqual(expect.arrayContaining([
      { status: "COMPLETED", count: 1 },
      { status: "NOT_COMPLETED", count: 1 },
    ]));
    expect(result.mentorLoad).toEqual([{ mentorProfileId: 4, fullName: "Mentor", completed: 1 }]);
    expect(result).not.toHaveProperty("feedbackAnswers");
  });
});
