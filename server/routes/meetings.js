const express = require("express");
const authenticate = require("../middleware/authenticate");
const {
  createMeetingFromSlot,
  cancelMeeting,
  requestMeetingReschedule,
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

router.post("/select-slot", async (req, res, next) => {
  try {
    const { requestId, slotId, menteeId } = req.body;

    if (!requestId || !slotId || !menteeId) {
      return res.status(400).json({
        error: "requestId, slotId and menteeId are required",
      });
    }

    const meeting = await createMeetingFromSlot({
      requestId,
      slotId,
      menteeId,
    });

    return res.status(201).json(meeting);
  } catch (error) {
    return handleServiceError(error, res, next);
  }
});

router.patch("/:meetingId/cancel", authenticate, async (req, res, next) => {
  try {
    const meeting = await cancelMeeting({
      meetingId: req.params.meetingId,
      userId: req.auth.userId,
    });

    return res.json(meeting);
  } catch (error) {
    return handleServiceError(error, res, next);
  }
});

router.patch("/:meetingId/reschedule", authenticate, async (req, res, next) => {
  try {
    const request = await requestMeetingReschedule({
      meetingId: req.params.meetingId,
      userId: req.auth.userId,
    });
    return res.json(request);
  } catch (error) {
    return handleServiceError(error, res, next);
  }
});

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
