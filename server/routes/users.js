const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const {
  getAllUsers,
  updateMentorProfile,
  validateProfileInput,
} = require("../services/usersService");

// PATCH /api/users/profile - Update the authenticated mentor's profile
router.patch("/profile", authenticate, async (req, res, next) => {
  const validationErrors = validateProfileInput(req.body);

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    const user = await updateMentorProfile(req.auth.userId, req.body);
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
