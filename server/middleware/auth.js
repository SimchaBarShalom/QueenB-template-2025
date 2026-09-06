const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { sanitizeUser } = require("../services/authService");

const DEFAULT_JWT_SECRET = "development-only-change-me";

function getJwtSecret() {
  return process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
}

function signAuthToken(user) {
  return jwt.sign({ userId: user.id }, getJwtSecret(), { expiresIn: "7d" });
}

async function requireAuth(req, res, next) {
  try {
    const header = req.get("authorization") || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    let payload;
    try {
      payload = jwt.verify(token, getJwtSecret());
    } catch (error) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(payload.userId) },
      include: {
        technologies: true,
        mentorProfile: { include: { mentoringTopics: true } },
      },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = sanitizeUser(user);
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  return next();
}

module.exports = {
  requireAdmin,
  requireAuth,
  signAuthToken,
};
