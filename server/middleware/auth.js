const prisma = require("../lib/prisma");
const { JsonWebTokenError, TokenExpiredError } = require("jsonwebtoken");
const { sanitizeUser } = require("../services/authService");
const { verifyAuthToken } = require("../services/authTokenService");

function authenticate(req, res, next) {
  const authorization = req.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = verifyAuthToken(match[1]);

    if (!Number.isInteger(payload.userId)) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    req.auth = { userId: payload.userId };
    return next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return res.status(401).json({ error: "Authentication token expired" });
    }

    if (error instanceof JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    return next(error);
  }
}

async function requireAuth(req, res, next) {
  try {
    const authorization = req.get("authorization");
    const match = authorization?.match(/^Bearer\s+(.+)$/i);

    if (!match) {
      return res.status(401).json({ error: "Authentication required" });
    }

    let payload;
    try {
      payload = verifyAuthToken(match[1]);
    } catch (error) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    if (!Number.isInteger(payload.userId)) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        technologies: true,
        mentorProfile: { include: { mentoringTopics: true } },
      },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = sanitizeUser(user);
    req.auth = { userId: payload.userId };
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
  authenticate,
  requireAdmin,
  requireAuth,
};
