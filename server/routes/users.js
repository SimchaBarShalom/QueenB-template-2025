const express = require("express");
const router = express.Router();
const { getAllUsers } = require("../services/usersService");

// GET /api/users - Get all users
router.get("/", async (req, res, next) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
