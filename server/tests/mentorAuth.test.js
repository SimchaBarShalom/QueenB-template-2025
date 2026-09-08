const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

process.env.JWT_SECRET = "test-jwt-secret";

jest.mock("../lib/prisma", () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}));

const prisma = require("../lib/prisma");
const {
  loginUser,
  registerUser,
  validateRegistrationInput,
} = require("../services/authService");
const { createAuthToken } = require("../services/authTokenService");
const { authenticate } = require("../middleware/auth");

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function createdMentorUser(overrides = {}) {
  return {
    id: 1,
    email: "mentor@example.com",
    fullName: "Maya Cohen",
    jobTitle: "Engineer",
    workplace: "Acme",
    yearsOfExperience: 3,
    githubUrl: null,
    linkedinUrl: null,
    isAdmin: false,
    createdAt: new Date(),
    technologies: [],
    mentorProfile: {
      id: 5,
      background: "Engineer — Acme",
      meetingCapacity: 4,
      meetingDurationMinutes: 60,
      isActive: true,
      mentoringTopics: [{ name: "React" }],
    },
    ...overrides,
  };
}

const validMentorInput = {
  firstName: "Maya",
  lastName: "Cohen",
  email: "  Mentor@Example.com ",
  password: "password1",
  wantsToBeMentor: true,
  jobTitle: " Engineer ",
  workplace: " Acme ",
  yearsOfExperience: 3,
  mentoringTopics: [" React ", "CV Review", ""],
  meetingCapacity: "4",
  meetingDurationMinutes: "60",
};

describe("mentor registration and authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requires at least one topic, positive capacity, and positive duration for mentors", () => {
    const errors = validateRegistrationInput({
      firstName: "Maya",
      lastName: "Cohen",
      email: "maya@example.com",
      password: "password1",
      wantsToBeMentor: true,
      mentoringTopics: [],
      meetingCapacity: 0,
      meetingDurationMinutes: -30,
    });

    expect(errors).toEqual([
      "At least one mentoring topic is required for mentors",
      "Meeting capacity is required for mentors",
      "Meeting duration is required for mentors",
    ]);
  });

  it("derives mentor background from job title and workplace with an em dash", async () => {
    prisma.user.create.mockResolvedValue(createdMentorUser());

    await registerUser(validMentorInput);

    expect(prisma.user.create.mock.calls[0][0].data.mentorProfile.create.background).toBe(
      "Engineer — Acme"
    );
  });

  it("falls back to לא צוין when mentor job title and workplace are missing", async () => {
    prisma.user.create.mockResolvedValue(createdMentorUser({ jobTitle: null, workplace: null }));

    await registerUser({
      ...validMentorInput,
      jobTitle: "  ",
      workplace: "",
    });

    expect(prisma.user.create.mock.calls[0][0].data.mentorProfile.create.background).toBe("לא צוין");
  });

  it("uses a lone job title or workplace as background when the other is missing", async () => {
    prisma.user.create.mockResolvedValue(createdMentorUser());

    await registerUser({ ...validMentorInput, workplace: null });
    expect(prisma.user.create.mock.calls[0][0].data.mentorProfile.create.background).toBe("Engineer");

    await registerUser({ ...validMentorInput, jobTitle: undefined, workplace: " Acme " });
    expect(prisma.user.create.mock.calls[1][0].data.mentorProfile.create.background).toBe("Acme");
  });

  it("lowercases the email and composes fullName from first and last name", async () => {
    prisma.user.create.mockResolvedValue(createdMentorUser());

    await registerUser(validMentorInput);

    expect(prisma.user.create.mock.calls[0][0].data).toEqual(
      expect.objectContaining({
        email: "mentor@example.com",
        fullName: "Maya Cohen",
      })
    );
  });

  it("hashes the password with bcrypt cost 10", async () => {
    const hashSpy = jest.spyOn(bcrypt, "hash");
    prisma.user.create.mockResolvedValue(createdMentorUser());

    await registerUser(validMentorInput);

    expect(hashSpy).toHaveBeenCalledWith("password1", 10);
    hashSpy.mockRestore();
  });

  it("connects or creates mentoring topics on the mentor profile", async () => {
    prisma.user.create.mockResolvedValue(createdMentorUser());

    await registerUser(validMentorInput);

    expect(prisma.user.create.mock.calls[0][0].data.mentorProfile.create.mentoringTopics).toEqual({
      connectOrCreate: [
        { where: { name: "React" }, create: { name: "React" } },
        { where: { name: "CV Review" }, create: { name: "CV Review" } },
      ],
    });
  });

  it("returns null for an unknown email", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const result = await loginUser({ email: "missing@example.com", password: "password1" });

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "missing@example.com" } })
    );
    expect(result).toBeNull();
  });

  it("returns null for a bad password", async () => {
    const passwordHash = await bcrypt.hash("password1", 10);
    prisma.user.findUnique.mockResolvedValue({
      ...createdMentorUser(),
      passwordHash,
    });

    const result = await loginUser({ email: "mentor@example.com", password: "wrong-pass" });

    expect(result).toBeNull();
  });

  it("logs in a mentor whose profile is inactive", async () => {
    const passwordHash = await bcrypt.hash("password1", 10);
    prisma.user.findUnique.mockResolvedValue({
      ...createdMentorUser({
        mentorProfile: {
          id: 5,
          background: "Engineer — Acme",
          meetingCapacity: 4,
          meetingDurationMinutes: 60,
          isActive: false,
          mentoringTopics: [{ name: "React" }],
        },
      }),
      passwordHash,
    });

    const result = await loginUser({ email: "  Mentor@Example.com ", password: "password1" });

    expect(result).not.toBeNull();
    expect(result.mentorProfile.isActive).toBe(false);
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "mentor@example.com" } })
    );
  });

  it("signs a JWT whose payload is userId only", () => {
    const token = createAuthToken(42);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { iat, exp, ...claims } = decoded;

    expect(claims).toEqual({ userId: 42 });
    expect(iat).toEqual(expect.any(Number));
    expect(exp).toEqual(expect.any(Number));
  });

  it("rejects a missing authentication token", () => {
    const req = { get: jest.fn(() => "") };
    const res = mockResponse();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Authentication required" });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a malformed authentication token", () => {
    const req = { get: jest.fn(() => "Bearer not-a-jwt") };
    const res = mockResponse();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Invalid authentication token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a non-integer userId with 401", () => {
    const token = jwt.sign({ userId: "1" }, process.env.JWT_SECRET);
    const req = { get: jest.fn(() => `Bearer ${token}`) };
    const res = mockResponse();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Invalid authentication token" });
    expect(next).not.toHaveBeenCalled();
  });
});
