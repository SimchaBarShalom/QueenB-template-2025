const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { sendEmail } = require("./emailService");

const TTL_MS = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 30) * 60 * 1000;
const GENERIC_MESSAGE = "If an account matches that email, a password reset link has been sent.";
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

async function requestPasswordReset(email) {
  const normalized = typeof email === "string" ? email.trim().toLowerCase() : "";
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (user?.passwordHash) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
      await tx.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + TTL_MS) } });
    });
    const baseUrl = process.env.CLIENT_BASE_URL || "http://localhost:3000";
    const link = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(rawToken)}`;
    try {
      await sendEmail({ to: user.email, subject: "Reset your Queen Match password", text: `Reset your password: ${link}`, html: `<p>Reset your password by opening this link:</p><p><a href="${link}">${link}</a></p>` });
    } catch (error) {
      // Keep the endpoint non-enumerating even if the configured mail service is down.
      console.error("Password reset email delivery failed:", error.message);
    }
  } else {
    await bcrypt.hash("timing-only-reset-value", 10);
  }
  return GENERIC_MESSAGE;
}

async function validateResetToken(rawToken) {
  if (typeof rawToken !== "string" || rawToken.length < 32) return false;
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  return Boolean(row && !row.usedAt && row.expiresAt > new Date());
}

async function resetPassword(rawToken, password) {
  const tokenHash = hashToken(rawToken || "");
  return prisma.$transaction(async (tx) => {
    const row = await tx.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!row || row.usedAt || row.expiresAt <= new Date()) { const e = new Error("Reset token is invalid or expired"); e.statusCode = 400; throw e; }
    const passwordHash = await bcrypt.hash(password, 10);
    await tx.user.update({ where: { id: row.userId }, data: { passwordHash } });
    await tx.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } });
  });
}

module.exports = { requestPasswordReset, validateResetToken, resetPassword, GENERIC_MESSAGE };
