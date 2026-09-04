const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    isAdmin: user.isAdmin,
    mentorProfile: user.mentorProfile || null,
    createdAt: user.createdAt,
  };
}

function validateRegistrationInput(input) {
  const errors = [];
  const { email, password, firstName, lastName } = input;

  if (!firstName || firstName.trim().length < 2) {
    errors.push("First name must be at least 2 characters");
  }

  if (!lastName || lastName.trim().length < 2) {
    errors.push("Last name must be at least 2 characters");
  }

  if (!email || !EMAIL_PATTERN.test(email)) {
    errors.push("A valid email is required");
  }

  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }

  return errors;
}

function validateLoginInput(input) {
  const errors = [];
  const { email, password } = input;

  if (!email || !EMAIL_PATTERN.test(email)) {
    errors.push("A valid email is required");
  }

  if (!password) {
    errors.push("Password is required");
  }

  return errors;
}

async function registerUser(input) {
  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email: input.email.trim().toLowerCase(),
      passwordHash,
      fullName: `${input.firstName.trim()} ${input.lastName.trim()}`,
    },
    include: {
      mentorProfile: true,
    },
  });

  return sanitizeUser(user);
}

async function loginUser(input) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.trim().toLowerCase() },
    include: {
      mentorProfile: true,
    },
  });

  if (!user) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    return null;
  }

  return sanitizeUser(user);
}

module.exports = {
  loginUser,
  registerUser,
  sanitizeUser,
  validateLoginInput,
  validateRegistrationInput,
};