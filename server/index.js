const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { Prisma } = require("@prisma/client");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    message: "QueenB Server is running!",
    timestamp: new Date().toISOString(),
    status: "healthy",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "Welcome to QueenB API" });
});

// Error handling middleware
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

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
});
