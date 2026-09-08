const express = require("express");
const authenticate = require("../middleware/authenticate");
const { getNotificationsForUser } = require("../services/notificationsService");

const router = express.Router();

router.get("/me", authenticate, async (req, res, next) => {
  try {
    return res.json(await getNotificationsForUser(req.auth.userId, req.query));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
