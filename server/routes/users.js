const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const { authenticate, requireAdmin } = require("../middleware/auth");

router.get("/", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
