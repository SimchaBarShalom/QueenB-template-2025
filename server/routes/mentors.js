const express = require("express");
const { getAllMentors } = require("../services/mentorsService");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const mentors = await getAllMentors(req.query);
    res.json(mentors);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
