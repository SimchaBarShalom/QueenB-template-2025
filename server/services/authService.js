const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeUser(user) {
  const mentorProfile = user.mentorProfile
    ? {
        id: user.mentorProfile.id,
        background: user.mentorProfile.background,
        meetingCapacity: user.mentorProfile.meetingCapacity,
        meetingDurationMinutes: user.mentorProfile.meetingDurationMinutes,
        isActive: user.mentorProfile.isActive,
        mentoringTopics: (user.mentorProfile.mentoringTopics || []).map((topic) => topic.name),
      }
    : null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    background: user.background || "לא צוין",
    jobTitle: user.jobTitle || null,
    workplace: user.workplace || null,
    yearsOfExperience: user.yearsOfExperience ?? null,
    githubUrl: user.githubUrl || null,
    linkedinUrl: user.linkedinUrl || null,
    technologies: (user.technologies || []).map((tech) => tech.name),
    isAdmin: user.isAdmin,
    mentorProfile,
    createdAt: user.createdAt,
  };
}

function validateRegistrationInput(input) {
  const errors = [];
  const { email, password, firstName, lastName, background, wantsToBeMentor } = input;

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

  if (typeof background !== "string" || background.trim().length < 2 || background.trim().length > 2000) {
    errors.push("Professional background must be between 2 and 2000 characters");
  }

  if (wantsToBeMentor) {
  const {
    mentoringTopics,
    meetingCapacity,
    meetingDurationMinutes,
  } = input;

  if (!Array.isArray(mentoringTopics) || mentoringTopics.length === 0) {
    errors.push("At least one mentoring topic is required for mentors");
  }

  if (!meetingCapacity || Number(meetingCapacity) <= 0) {
    errors.push("Meeting capacity is required for mentors");
  }

  if (!meetingDurationMinutes || Number(meetingDurationMinutes) <= 0) {
    errors.push("Meeting duration is required for mentors");
  }
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

const USER_INCLUDE = {
  technologies: true,
  mentorProfile: { include: { mentoringTopics: true } },
};

async function registerUser(input) {
  const passwordHash = await bcrypt.hash(input.password, 10);

  const technologies = Array.isArray(input.technologies)
    ? input.technologies.map((name) => name.trim()).filter(Boolean)
    : [];

  const wantsToBeMentor = Boolean(input.wantsToBeMentor);

  const derivedBackground = input.background?.trim() || [input.jobTitle?.trim(), input.workplace?.trim()].filter(Boolean).join(" — ") || "לא צוין";
  const data = {
    email: input.email.trim().toLowerCase(),
    passwordHash,
    fullName: `${input.firstName.trim()} ${input.lastName.trim()}`,
    background: derivedBackground,
    yearsOfExperience: input.yearsOfExperience ? Number(input.yearsOfExperience) : null,
    githubUrl: input.githubUrl?.trim() || null,
    linkedinUrl: input.linkedinUrl?.trim() || null,
    technologies: technologies.length
      ? { connectOrCreate: technologies.map((name) => ({ where: { name }, create: { name } })) }
      : undefined,
  };
if (wantsToBeMentor) {
  const jobTitle = input.jobTitle?.trim() || null;
  const workplace = input.workplace?.trim() || null;

  const mentoringTopics = input.mentoringTopics
    .map((name) => name.trim())
    .filter(Boolean);

  data.jobTitle = jobTitle;
  data.workplace = workplace;

  data.mentorProfile = {
    create: {
      background: derivedBackground,
      meetingCapacity: Number(input.meetingCapacity),
      meetingDurationMinutes: Number(input.meetingDurationMinutes),

      mentoringTopics: {
        connectOrCreate: mentoringTopics.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
  };
  }
else if (input.jobTitle || input.workplace) {
    data.jobTitle = input.jobTitle?.trim() || null;
    data.workplace = input.workplace?.trim() || null;
  }

  const user = await prisma.user.create({
    data,
    include: USER_INCLUDE,
  });

  return sanitizeUser(user);
}

async function loginUser(input) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.trim().toLowerCase() },
    include: USER_INCLUDE,
  });

  if (!user) {
    return null;
  }

  const passwordMatches = user.passwordHash ? await bcrypt.compare(input.password, user.passwordHash) : false;

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
