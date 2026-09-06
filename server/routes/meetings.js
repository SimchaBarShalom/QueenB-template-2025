const express = require("express");
const authenticate = require("../middleware/authenticate");
const {
  confirmMeetingOutcome,
  submitMeetingFeedback,
} = require("../services/meetingsService");

const router = express.Router();

function handleServiceError(error, res, next) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  return next(error);
}

router.patch("/:meetingId/outcome", authenticate, async (req, res, next) => {
  try {
    const meeting = await confirmMeetingOutcome({
      meetingId: req.params.meetingId,
      userId: req.auth.userId,
      occurred: req.body.occurred,
    });
    return res.json(meeting);
  } catch (error) {
    return handleServiceError(error, res, next);
  }
});

router.post("/:meetingId/feedback", authenticate, async (req, res, next) => {
  try {
    const feedback = await submitMeetingFeedback({
      meetingId: req.params.meetingId,
      userId: req.auth.userId,
      rating: req.body.rating,
      text: req.body.text,
    });
    return res.status(201).json(feedback);
  } catch (error) {
    return handleServiceError(error, res, next);
  }
});

module.exports = router;
