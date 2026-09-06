const { JsonWebTokenError, TokenExpiredError } = require("jsonwebtoken");
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

module.exports = authenticate;
