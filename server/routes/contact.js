const express = require("express");
const { sendContactMessage, validateContactInput } = require("../services/contactService");

const router = express.Router();

router.post("/", async (req, res, next) => {
  const errors = validateContactInput(req.body);
  if (errors.length) return res.status(400).json({ errors });
  try {
    await sendContactMessage(req.body);
    return res.json({ message: "Contact message sent" });
  } catch (error) {
    console.error("Contact email delivery failed:", error);
    return res.status(502).json({ error: "Unable to deliver contact message" });
  }
});

module.exports = router;
