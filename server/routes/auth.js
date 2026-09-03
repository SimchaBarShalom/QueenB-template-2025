const express = require("express");
const {
  loginUser,
  registerUser,
  validateRegistrationInput,
  validateLoginInput,
} = require("../services/authService");

const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const validationErrors = validateRegistrationInput(req.body);

    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const user = await registerUser(req.body);
    return res.status(201).json({ user });
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

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
