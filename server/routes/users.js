const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const {
  getAllUsers,
  createMentorProfile,
  updateMentorProfile,
  updateUserProfile,
  validateMentorProfileCreationInput,
  validateProfileInput,
} = require("../services/usersService");

router.post("/mentor-profile", authenticate, async (req, res, next) => {
  const validationErrors = validateMentorProfileCreationInput(req.body);

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    const user = await createMentorProfile(req.auth.userId, req.body);
    return res.status(201).json({ user });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    return next(error);
  }
});

// PATCH /api/users/profile - Update the authenticated user's base profile.
router.patch("/profile", authenticate, async (req, res, next) => {
  const validationErrors = validateProfileInput(req.body);

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    const mentorFields = ["background", "mentoringTopics", "meetingCapacity", "meetingDurationMinutes"];
    const user = mentorFields.some((field) => Object.hasOwn(req.body, field))
      ? await updateMentorProfile(req.auth.userId, req.body)
      : await updateUserProfile(req.auth.userId, req.body);
    return res.json({ user });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    return next(error);
  }
});

// GET /api/users - Get all users
router.get("/", async (req, res, next) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
