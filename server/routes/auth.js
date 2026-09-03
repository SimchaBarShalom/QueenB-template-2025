const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { authenticate, signToken } = require("../middleware/auth");
const { isValidPassword, requireFields } = require("../utils/validation");
const { isPositiveInteger } = require("../domain/rules");

const router = express.Router();

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  stack: true,
  workplace: true,
  yearsExperience: true,
  photoUrl: true,
  githubUrl: true,
  linkedinUrl: true,
};

function sendAuth(res, user) {
  res.status(201).json({ token: signToken(user), user });
}

async function register(req, res, role) {
  const missing = requireFields(req.body, ["name", "email", "password"]);
  if (missing.length) return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
  if (!isValidPassword(req.body.password)) {
    return res.status(400).json({ error: "Password must be at least 8 characters and include letters and numbers" });
  }

  const email = req.body.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already exists" });

  if (role === "MENTOR") {
    const mentorMissing = requireFields(req.body, [
      "stack",
      "workplace",
      "yearsExperience",
      "background",
      "topics",
      "meetingCapacity",
      "meetingDurationMinutes",
      "meetingLink",
    ]);
    if (mentorMissing.length) return res.status(400).json({ error: `Missing mentor fields: ${mentorMissing.join(", ")}` });
    if (!isPositiveInteger(req.body.yearsExperience) || !isPositiveInteger(req.body.meetingCapacity) || !isPositiveInteger(req.body.meetingDurationMinutes)) {
      return res.status(400).json({ error: "Mentor years, capacity and duration must be positive whole numbers" });
    }
  }

  const passwordHash = await bcrypt.hash(req.body.password, 10);
  const user = await prisma.user.create({
    data: {
      name: req.body.name,
      email,
      passwordHash,
      role,
      stack: req.body.stack || null,
      workplace: req.body.workplace || null,
      yearsExperience: req.body.yearsExperience === "" || req.body.yearsExperience === undefined ? null : Number(req.body.yearsExperience),
      photoUrl: req.body.photoUrl || null,
      githubUrl: req.body.githubUrl || null,
      linkedinUrl: req.body.linkedinUrl || null,
      mentorProfile: role === "MENTOR" ? {
        create: {
          background: req.body.background,
          topics: req.body.topics,
          meetingCapacity: Number(req.body.meetingCapacity),
          meetingDurationMinutes: Number(req.body.meetingDurationMinutes),
          meetingLink: req.body.meetingLink,
        },
      } : undefined,
    },
    select: publicUserSelect,
  });

  return sendAuth(res, user);
}

router.post("/register/mentee", (req, res, next) => register(req, res, "MENTEE").catch(next));
router.post("/register/mentor", (req, res, next) => register(req, res, "MENTOR").catch(next));

router.post("/login", async (req, res, next) => {
  try {
    const missing = requireFields(req.body, ["email", "password"]);
    if (missing.length) return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });

    const user = await prisma.user.findUnique({ where: { email: req.body.email.trim().toLowerCase() } });
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const { passwordHash, ...safeUser } = user;
    return res.json({ token: signToken(user), user: safeUser });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { ...publicUserSelect, mentorProfile: true },
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
