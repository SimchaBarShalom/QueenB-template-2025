const express = require("express");
const {
  loginUser,
  registerUser,
  validateRegistrationInput,
  validateLoginInput,
} = require("../services/authService");
const { createAuthToken } = require("../services/authTokenService");

const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const validationErrors = validateRegistrationInput(req.body);

    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const user = await registerUser(req.body);
    const token = createAuthToken(user.id);
    return res.status(201).json({ user, token });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Email already exists" });
    }

    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const validationErrors = validateLoginInput(req.body);

    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const user = await loginUser(req.body);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = createAuthToken(user.id);
    return res.json({ user, token });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
