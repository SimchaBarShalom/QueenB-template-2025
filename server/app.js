const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { Prisma } = require("@prisma/client");
require("dotenv").config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/mentors", require("./routes/mentors"));
app.use("/api/mentoring-requests", require("./routes/mentoringRequests"));
app.use("/api/admin", require("./routes/admin"));

app.get("/api/health", (req, res) => {
  res.json({
    message: "QueenB Server is running!",
    timestamp: new Date().toISOString(),
    status: "healthy",
  });
});

app.get("/", (req, res) => {
  res.json({ message: "Welcome to QueenB API" });
});

app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return res.status(503).json({
      error:
        "Cannot connect to the database. Check that PostgreSQL is running and that DATABASE_URL in server/.env is correct.",
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2021") {
      return res.status(500).json({
        error: "Database tables are missing. Run `npm run prisma:migrate` from the server folder.",
      });
    }

    if (err.code === "P2022") {
      return res.status(500).json({
        error: "Database columns are missing. Run `npm run prisma:migrate` from the server folder.",
      });
    }
  }

  return res.status(500).json({ error: "Something went wrong. Check the server terminal for details." });
});

app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

module.exports = app;
