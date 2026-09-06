const jwt = require("jsonwebtoken");

jest.mock("../lib/prisma", () => ({
  user: {
    findUnique: jest.fn(),
  },
}));

const prisma = require("../lib/prisma");
const { requireAdmin, requireAuth } = require("../middleware/auth");

function tokenFor(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "development-only-change-me");
}

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

const baseUser = {
  id: 1,
  email: "user@example.com",
  fullName: "Test User",
  isAdmin: false,
  technologies: [],
  mentorProfile: null,
  createdAt: new Date(),
};

describe("admin authorization middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects unauthenticated admin requests", async () => {
    const req = { get: jest.fn(() => "") };
    const res = mockResponse();
    const next = jest.fn();

    await requireAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects authenticated non-admin users", async () => {
    const req = {
      get: jest.fn(() => `Bearer ${tokenFor(1)}`),
    };
    const res = mockResponse();
    const next = jest.fn();
    prisma.user.findUnique.mockResolvedValue(baseUser);

    await requireAuth(req, res, next);
    requireAdmin(req, res, next);

    expect(res.statusCode).toBe(403);
  });

  it("allows authenticated admin users", async () => {
    const req = {
      get: jest.fn(() => `Bearer ${tokenFor(1)}`),
    };
    const res = mockResponse();
    const next = jest.fn();
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, isAdmin: true });

    await requireAuth(req, res, next);
    requireAdmin(req, res, next);

    expect(req.user.isAdmin).toBe(true);
    expect(next).toHaveBeenCalledTimes(2);
  });
});
