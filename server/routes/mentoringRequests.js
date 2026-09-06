const express = require("express");
const {
  createMentoringRequest,
  getMentoringRequestsByMentee,
  cancelMentoringRequest,
} = require("../services/mentoringRequestsService");

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { menteeId, mentorProfileId } = req.body;

    if (!menteeId || !mentorProfileId) {
      return res.status(400).json({
        error: "menteeId and mentorProfileId are required",
      });
    }

    const request = await createMentoringRequest({
      menteeId,
      mentorProfileId,
    });

    return res.status(201).json(request);
  } catch (error) {
    next(error);
  }
});

router.get("/mentee/:menteeId", async (req, res, next) => {
  try {
    const requests = await getMentoringRequestsByMentee(
      req.params.menteeId
    );

    return res.json(requests);
  } catch (error) {
    next(error);
  }
});

router.patch("/:requestId/cancel", async (req, res, next) => {
  try {
    const { menteeId } = req.body;

    if (!menteeId) {
      return res.status(400).json({
        error: "menteeId is required",
      });
    }

    const request = await cancelMentoringRequest({
      requestId: req.params.requestId,
      menteeId,
    });

    return res.json(request);
  } catch (error) {
    next(error);
  }
});

module.exports = router;