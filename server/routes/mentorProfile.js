const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");
const { requireFields } = require("../utils/validation");
const { isPositiveInteger } = require("../domain/rules");

const router = express.Router();

router.put("/me", authenticate, async (req, res, next) => {
  try {
    const missing = requireFields(req.body, [
      "stack",
      "workplace",
      "yearsExperience",
      "background",
      "topics",
      "meetingCapacity",
      "meetingDurationMinutes",
      "meetingLink",
    ]);
    if (missing.length) return res.status(400).json({ error: `Missing mentor fields: ${missing.join(", ")}` });
    if (!isPositiveInteger(req.body.yearsExperience) || !isPositiveInteger(req.body.meetingCapacity) || !isPositiveInteger(req.body.meetingDurationMinutes)) {
      return res.status(400).json({ error: "Years, capacity and duration must be positive whole numbers" });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        role: req.user.role === "ADMIN" ? "ADMIN" : "MENTOR",
        stack: req.body.stack,
        workplace: req.body.workplace,
        yearsExperience: Number(req.body.yearsExperience),
        photoUrl: req.body.photoUrl || null,
        githubUrl: req.body.githubUrl || null,
        linkedinUrl: req.body.linkedinUrl || null,
        mentorProfile: {
          upsert: {
            create: {
              background: req.body.background,
              topics: req.body.topics,
              meetingCapacity: Number(req.body.meetingCapacity),
              meetingDurationMinutes: Number(req.body.meetingDurationMinutes),
              meetingLink: req.body.meetingLink,
              isActive: true,
            },
            update: {
              background: req.body.background,
              topics: req.body.topics,
              meetingCapacity: Number(req.body.meetingCapacity),
              meetingDurationMinutes: Number(req.body.meetingDurationMinutes),
              meetingLink: req.body.meetingLink,
              isActive: true,
            },
          },
        },
      },
      select: { id: true, name: true, email: true, role: true, stack: true, workplace: true, yearsExperience: true, photoUrl: true, githubUrl: true, linkedinUrl: true, mentorProfile: true },
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
