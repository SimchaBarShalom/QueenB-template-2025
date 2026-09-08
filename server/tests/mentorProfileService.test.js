jest.mock("../lib/prisma", () => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
}));

const prisma = require("../lib/prisma");
const usersService = require("../services/usersService");
const mentorsService = require("../services/mentorsService");

describe("usersService mentor profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects meetingCapacity outside 1–100", () => {
    const message = "Meeting capacity must be a whole number between 1 and 100";

    expect(usersService.validateProfileInput({ meetingCapacity: 0 })).toContain(message);
    expect(usersService.validateProfileInput({ meetingCapacity: 101 })).toContain(message);
    expect(usersService.validateProfileInput({ meetingCapacity: 1.5 })).toContain(message);
    expect(usersService.validateMentorProfileCreationInput({
      fullName: "Ada Lovelace",
      background: "Mentors on frontend work",
      mentoringTopics: ["React"],
      meetingCapacity: 101,
      meetingDurationMinutes: 45,
    })).toContain(message);
  });

  it("rejects meetingDurationMinutes outside 30, 45, 60, or 90", () => {
    const message = "Meeting duration must be 30, 45, 60, or 90 minutes";

    expect(usersService.validateProfileInput({ meetingDurationMinutes: 15 })).toContain(message);
    expect(usersService.validateProfileInput({ meetingDurationMinutes: 20 })).toContain(message);
    expect(usersService.validateProfileInput({ meetingDurationMinutes: 120 })).toContain(message);
    expect(usersService.validateMentorProfileCreationInput({
      fullName: "Ada Lovelace",
      background: "Mentors on frontend work",
      mentoringTopics: ["React"],
      meetingCapacity: 3,
      meetingDurationMinutes: 75,
    })).toContain(message);
  });

  it("rejects creating a second mentor profile", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, mentorProfile: { id: 9 } });

    await expect(
      usersService.createMentorProfile(1, {
        fullName: "Ada Lovelace",
        background: "Mentors on frontend work",
        mentoringTopics: ["React"],
        meetingCapacity: 3,
        meetingDurationMinutes: 45,
      })
    ).rejects.toMatchObject({
      message: "A mentor profile already exists",
      statusCode: 409,
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects mentor profile updates from a non-mentor", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2, mentorProfile: null });

    await expect(usersService.updateMentorProfile(2, { background: "Updated bio" })).rejects.toMatchObject({
      message: "Only mentors can update a mentor profile",
      statusCode: 403,
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("deduplicates and trims mentoring topics", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, mentorProfile: { id: 4 } });
    prisma.user.update.mockResolvedValue({
      id: 1,
      email: "ada@example.com",
      fullName: "Ada Lovelace",
      jobTitle: null,
      workplace: null,
      yearsOfExperience: null,
      githubUrl: null,
      linkedinUrl: null,
      isAdmin: false,
      createdAt: new Date(),
      technologies: [],
      mentorProfile: {
        id: 4,
        background: "Mentors on frontend work",
        meetingCapacity: 3,
        meetingDurationMinutes: 45,
        isActive: true,
        mentoringTopics: [{ name: "React" }, { name: "CV Review" }],
      },
    });

    const result = await usersService.updateMentorProfile(1, {
      mentoringTopics: [" React ", "React", " CV Review ", ""],
    });

    expect(prisma.user.update.mock.calls[0][0].data.mentorProfile.update.mentoringTopics).toEqual({
      set: [],
      connectOrCreate: [
        { where: { name: "React" }, create: { name: "React" } },
        { where: { name: "CV Review" }, create: { name: "CV Review" } },
      ],
    });
    expect(result.mentorProfile.mentoringTopics).toEqual(["React", "CV Review"]);
  });
});

describe("mentorsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists active mentors ordered by fullName without email or passwordHash", async () => {
    prisma.user.findMany.mockResolvedValue([
      {
        id: 2,
        email: "ada@example.com",
        passwordHash: "hashed-secret",
        fullName: "Ada Lovelace",
        jobTitle: "Engineer",
        workplace: "Lab",
        yearsOfExperience: 5,
        githubUrl: null,
        linkedinUrl: null,
        technologies: [{ name: "Python" }],
        mentorProfile: {
          id: 10,
          background: "Math and computing",
          meetingCapacity: 3,
          meetingDurationMinutes: 60,
          mentoringTopics: [{ name: "CV Review" }],
        },
      },
    ]);

    const result = await mentorsService.getAllMentors();

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        mentorProfile: {
          is: {
            isActive: true,
          },
        },
      },
      include: {
        technologies: true,
        mentorProfile: {
          include: {
            mentoringTopics: true,
          },
        },
      },
      orderBy: {
        fullName: "asc",
      },
    });
    expect(result).toEqual([
      {
        id: 2,
        fullName: "Ada Lovelace",
        jobTitle: "Engineer",
        workplace: "Lab",
        yearsOfExperience: 5,
        githubUrl: null,
        linkedinUrl: null,
        technologies: ["Python"],
        mentorProfileId: 10,
        background: "Math and computing",
        meetingCapacity: 3,
        meetingDurationMinutes: 60,
        mentoringTopics: ["CV Review"],
      },
    ]);
    expect(result[0]).not.toHaveProperty("email");
    expect(result[0]).not.toHaveProperty("passwordHash");
  });
});
