const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

const mentorInclude = {
  mentorProfile: true,
};

router.get("/", authenticate, async (req, res, next) => {
  try {
    const mentors = await prisma.user.findMany({
      where: { role: "MENTOR", mentorProfile: { isActive: true } },
      select: {
        id: true,
        name: true,
        email: true,
        stack: true,
        workplace: true,
        yearsExperience: true,
        photoUrl: true,
        githubUrl: true,
        linkedinUrl: true,
        mentorProfile: true,
      },
      orderBy: { name: "asc" },
    });
    res.json(mentors);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const mentor = await prisma.user.findFirst({
      where: { id: Number(req.params.id), role: "MENTOR", mentorProfile: { isActive: true } },
      select: {
        id: true,
        name: true,
        email: true,
        stack: true,
        workplace: true,
        yearsExperience: true,
        photoUrl: true,
        githubUrl: true,
        linkedinUrl: true,
        mentorProfile: true,
      },
    });
    if (!mentor) return res.status(404).json({ error: "Mentor not found" });
    res.json(mentor);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
