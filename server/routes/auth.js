const express = require("express");
const {
  loginUser,
  registerUser,
  validateRegistrationInput,
  validateLoginInput,
} = require("../services/authService");
const { createAuthToken } = require("../services/authTokenService");
const { requireAuth } = require("../middleware/auth");
const { getGoogleAuthorizationUrl, verifyGoogleCode, createHandoff, consumeHandoff, completeGoogleSignIn, findExistingUser, states } = require("../services/googleAuthService");
const { requestPasswordReset, validateResetToken, resetPassword, GENERIC_MESSAGE } = require("../services/passwordResetService");

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

router.get("/me", requireAuth, async (req, res) => {
  return res.json({ user: req.user });
});

router.get("/google", async (req, res, next) => {
  try { return res.redirect((await getGoogleAuthorizationUrl()).authorizationUrl); } catch (error) { return next(error); }
});

router.get("/google/callback", async (req, res, next) => {
  const frontend = (process.env.CLIENT_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
  try {
    if (typeof req.query.state !== "string") return res.redirect(`${frontend}/auth/google/callback?error=invalid_state`);
    const pending = states.get(req.query.state);
    states.delete(req.query.state);
    if (!pending || pending.expiresAt < Date.now()) return res.redirect(`${frontend}/auth/google/callback?error=invalid_state`);
    if (req.query.error) return res.redirect(`${frontend}/auth/google/callback?error=cancelled`);
    const identity = await verifyGoogleCode(req.query.code);
    const handoff = createHandoff({ identity });
    return res.redirect(`${frontend}/auth/google/callback?code=${encodeURIComponent(handoff)}`);
  } catch (error) {
    return res.redirect(`${frontend}/auth/google/callback?error=provider`);
  }
});

router.post("/google/exchange", async (req, res, next) => {
  try {
    const { identity } = consumeHandoff(req.body.code);
    const existing = await findExistingUser(identity);
    if (!existing) return res.json({ needsOnboarding: true, onboardingCode: createHandoff({ identity }) });
    const user = await completeGoogleSignIn(identity);
    return res.json({ user, token: createAuthToken(user.id) });
  } catch (error) { return next(error); }
});

router.post("/google/complete", async (req, res, next) => {
  try {
    const { identity } = consumeHandoff(req.body.code);
    const user = await completeGoogleSignIn(identity, req.body.role, req.body.details);
    return res.status(201).json({ user, token: createAuthToken(user.id) });
  } catch (error) { return next(error); }
});

router.post("/forgot-password", async (req, res, next) => {
  try { await requestPasswordReset(req.body.email); return res.json({ message: GENERIC_MESSAGE }); } catch (error) { return next(error); }
});

router.get("/reset-password/validate", async (req, res, next) => {
  try { return res.json({ valid: await validateResetToken(req.query.token) }); } catch (error) { return next(error); }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;
    if (typeof password !== "string" || password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) return res.status(400).json({ error: "Password does not meet requirements" });
    if (password !== confirmPassword) return res.status(400).json({ error: "Passwords do not match" });
    await resetPassword(token, password);
    return res.json({ message: "Password reset successfully" });
  } catch (error) { return next(error); }
});

module.exports = router;
