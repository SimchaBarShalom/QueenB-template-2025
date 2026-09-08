const express = require("express");
const {
  createMentoringRequest,
  getMentoringRequestsByMentee,
  getMentoringRequestsByMentorUser,
  offerMentoringRequestSlots,
  selectMentoringRequestSlot,
  offerRescheduleSlots,
  rejectMentoringRequest,
  cancelMentoringRequest,
  declineOfferedSlots,
} = require("../services/mentoringRequestsService");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

function handleServiceError(error, res, next) {
  if (error.statusCode) {
    return res
      .status(error.statusCode)
      .json({ error: error.message, ...error.details });
  }

  return next(error);
}

router.post("/", authenticate, async (req, res, next) => {
  try {
    const { mentorProfileId } = req.body;

    if (!mentorProfileId) {
      return res.status(400).json({
        error: "mentorProfileId is required",
      });
    }

    const request = await createMentoringRequest({
      menteeId: req.auth.userId,
      mentorProfileId,
    });

    return res.status(201).json(request);
  } catch (error) {
    return handleServiceError(error, res, next);
  }
});

router.get("/mentor/me", authenticate, async (req, res, next) => {
  try {
    const requests = await getMentoringRequestsByMentorUser(req.auth.userId, req.query);
    return res.json(requests);
  } catch (error) {
    return handleServiceError(error, res, next);
  }
});

router.get("/mentee/:menteeId", authenticate, async (req, res, next) => {
  try {
    if (Number(req.params.menteeId) !== Number(req.auth.userId)) return res.status(403).json({ error: "Access denied" });
    const requests = await getMentoringRequestsByMentee(
      req.params.menteeId, req.query
    );

    return res.json(requests);
  } catch (error) {
    next(error);
  }
});

router.patch("/:requestId/reject", authenticate, async (req, res, next) => {
  try {
    const request = await rejectMentoringRequest({
      requestId: req.params.requestId,
      userId: req.auth.userId,
    });

    return res.json(request);
  } catch (error) {
    return handleServiceError(error, res, next);
  }
});

router.post("/:requestId/slots", authenticate, async (req, res, next) => {
  try {
    const request = await offerMentoringRequestSlots({
      requestId: req.params.requestId,
      userId: req.auth.userId,
      slots: req.body.slots,
      confirmOverCapacity: req.body.confirmOverCapacity === true,
    });

    return res.status(201).json(request);
  } catch (error) {
    return handleServiceError(error, res, next);
  }
});

router.post("/:requestId/select-slot", authenticate, async (req, res, next) => {
  try {
    const request = await selectMentoringRequestSlot({
      requestId: req.params.requestId,
      userId: req.auth.userId,
      slotId: req.body.slotId,
    });

    return res.status(201).json(request);
  } catch (error) {
    return handleServiceError(error, res, next);
  }
});

router.post("/:requestId/reschedule-slots", authenticate, async (req, res, next) => {
  try {
    const request = await offerRescheduleSlots({
      requestId: req.params.requestId,
      userId: req.auth.userId,
      slots: req.body.slots,
    });

    return res.status(201).json(request);
  } catch (error) {
    return handleServiceError(error, res, next);
  }
});

router.patch("/:requestId/decline-slots", authenticate, async (req, res, next) => {
  try {
    const request = await declineOfferedSlots({
      requestId: req.params.requestId,
      menteeId: req.auth.userId,
    });

    return res.json(request);
  } catch (error) {
    return handleServiceError(error, res, next);
  }
});

router.patch("/:requestId/cancel", authenticate, async (req, res, next) => {
  try {
    const request = await cancelMentoringRequest({
      requestId: req.params.requestId,
      menteeId: req.auth.userId,
    });

    return res.json(request);
  } catch (error) {
    return handleServiceError(error, res, next);
  }
});

module.exports = router;
