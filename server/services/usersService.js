const prisma = require("../lib/prisma");
const { sanitizeUser } = require("./authService");

const USER_INCLUDE = {
  technologies: true,
  mentorProfile: { include: { mentoringTopics: true } },
};

const EDITABLE_FIELDS = [
  "fullName",
  "jobTitle",
  "workplace",
  "yearsOfExperience",
  "githubUrl",
  "linkedinUrl",
  "technologies",
  "background",
  "mentoringTopics",
  "meetingCapacity",
  "meetingDurationMinutes",
];

const ALLOWED_MEETING_DURATIONS = [30, 45, 60, 90];

function isValidOptionalUrl(value) {
  if (value === "" || value === null || value === undefined) {
    return true;
  }

  if (typeof value !== "string") {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isStringList(value, maxItems = 20) {
  return (
    Array.isArray(value) &&
    value.length <= maxItems &&
    value.every((item) => typeof item === "string" && item.trim().length > 0 && item.trim().length <= 80)
  );
}

function isValidFullName(value) {
  if (typeof value !== "string") return false;

  const normalized = value.trim().replace(/\s+/g, " ");
  const [firstName, ...lastNameParts] = normalized.split(" ");
  const lastName = lastNameParts.join(" ");

  return firstName.length >= 2 && lastName.length >= 2 && normalized.length <= 100;
}

function validateProfileInput(input) {
  const errors = [];

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return ["Profile data is required"];
  }

  if (!EDITABLE_FIELDS.some((field) => Object.hasOwn(input, field))) {
    errors.push("At least one editable profile field is required");
  }

  if (
    Object.hasOwn(input, "fullName") &&
    !isValidFullName(input.fullName)
  ) {
    errors.push("First and last name must each contain at least 2 characters");
  }

  for (const field of ["jobTitle", "workplace"]) {
    if (
      Object.hasOwn(input, field) &&
      input[field] !== null &&
      (typeof input[field] !== "string" || input[field].trim().length > 100)
    ) {
      errors.push(`${field} must be at most 100 characters`);
    }
  }

  if (
    Object.hasOwn(input, "background") &&
    (typeof input.background !== "string" ||
      input.background.trim().length < 2 ||
      input.background.trim().length > 2000)
  ) {
    errors.push("Bio must be between 2 and 2000 characters");
  }

  if (
    Object.hasOwn(input, "yearsOfExperience") &&
    input.yearsOfExperience !== null &&
    input.yearsOfExperience !== "" &&
    (!Number.isInteger(Number(input.yearsOfExperience)) ||
      Number(input.yearsOfExperience) < 0 ||
      Number(input.yearsOfExperience) > 80)
  ) {
    errors.push("Years of experience must be a whole number between 0 and 80");
  }

  for (const field of ["githubUrl", "linkedinUrl"]) {
    if (Object.hasOwn(input, field) && !isValidOptionalUrl(input[field])) {
      errors.push(`${field} must be a valid http or https URL`);
    }
  }

  if (Object.hasOwn(input, "technologies") && !isStringList(input.technologies)) {
    errors.push("Technologies must contain at most 20 non-empty values");
  }

  if (
    Object.hasOwn(input, "mentoringTopics") &&
    (!isStringList(input.mentoringTopics) || input.mentoringTopics.length === 0)
  ) {
    errors.push("At least one mentoring topic is required");
  }

  if (
    Object.hasOwn(input, "meetingCapacity") &&
    (!Number.isInteger(Number(input.meetingCapacity)) ||
      Number(input.meetingCapacity) < 1 ||
      Number(input.meetingCapacity) > 100)
  ) {
    errors.push("Meeting capacity must be a whole number between 1 and 100");
  }

  if (
    Object.hasOwn(input, "meetingDurationMinutes") &&
    !ALLOWED_MEETING_DURATIONS.includes(Number(input.meetingDurationMinutes))
  ) {
    errors.push("Meeting duration must be 30, 45, 60, or 90 minutes");
  }

  return errors;
}

function validateMentorProfileCreationInput(input) {
  const errors = validateProfileInput(input);

  for (const field of [
    "fullName",
    "background",
    "mentoringTopics",
    "meetingCapacity",
    "meetingDurationMinutes",
  ]) {
    if (!Object.hasOwn(input || {}, field)) {
      errors.push(`${field} is required to create a mentor profile`);
    }
  }

  return errors;
}

function optionalText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function uniqueStrings(values) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function getAllUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: USER_INCLUDE,
  });

  return users.map(sanitizeUser);
}

async function createMentorProfile(userId, input) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, mentorProfile: { select: { id: true } } },
  });

  if (!existingUser) {
    throw createServiceError("Authenticated user no longer exists", 401);
  }

  if (existingUser.mentorProfile) {
    throw createServiceError("A mentor profile already exists", 409);
  }

  const technologies = uniqueStrings(input.technologies || []);
  const mentoringTopics = uniqueStrings(input.mentoringTopics || []);
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: input.fullName.trim(),
      jobTitle: optionalText(input.jobTitle),
      workplace: optionalText(input.workplace),
      yearsOfExperience:
        input.yearsOfExperience === null || input.yearsOfExperience === ""
          ? null
          : Number(input.yearsOfExperience),
      githubUrl: optionalText(input.githubUrl),
      linkedinUrl: optionalText(input.linkedinUrl),
      technologies: {
        set: [],
        connectOrCreate: technologies.map((name) => ({ where: { name }, create: { name } })),
      },
      mentorProfile: {
        create: {
          background: input.background.trim(),
          meetingCapacity: Number(input.meetingCapacity),
          meetingDurationMinutes: Number(input.meetingDurationMinutes),
          mentoringTopics: {
            connectOrCreate: mentoringTopics.map((name) => ({ where: { name }, create: { name } })),
          },
        },
      },
    },
    include: USER_INCLUDE,
  });

  return sanitizeUser(updatedUser);
}

async function updateMentorProfile(userId, input) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, mentorProfile: { select: { id: true } } },
  });

  if (!existingUser) {
    throw createServiceError("Authenticated user no longer exists", 401);
  }

  if (!existingUser.mentorProfile) {
    throw createServiceError("Only mentors can update a mentor profile", 403);
  }

  const data = {};

  if (Object.hasOwn(input, "fullName")) data.fullName = input.fullName.trim();
  if (Object.hasOwn(input, "jobTitle")) data.jobTitle = optionalText(input.jobTitle);
  if (Object.hasOwn(input, "workplace")) data.workplace = optionalText(input.workplace);
  if (Object.hasOwn(input, "yearsOfExperience")) {
    data.yearsOfExperience =
      input.yearsOfExperience === null || input.yearsOfExperience === ""
        ? null
        : Number(input.yearsOfExperience);
  }
  if (Object.hasOwn(input, "githubUrl")) data.githubUrl = optionalText(input.githubUrl);
  if (Object.hasOwn(input, "linkedinUrl")) data.linkedinUrl = optionalText(input.linkedinUrl);

  if (Object.hasOwn(input, "technologies")) {
    const technologies = uniqueStrings(input.technologies);
    data.technologies = {
      set: [],
      connectOrCreate: technologies.map((name) => ({
        where: { name },
        create: { name },
      })),
    };
  }

  const mentorProfileData = {};
  if (Object.hasOwn(input, "background")) mentorProfileData.background = input.background.trim();
  if (Object.hasOwn(input, "meetingCapacity")) {
    mentorProfileData.meetingCapacity = Number(input.meetingCapacity);
  }
  if (Object.hasOwn(input, "meetingDurationMinutes")) {
    mentorProfileData.meetingDurationMinutes = Number(input.meetingDurationMinutes);
  }
  if (Object.hasOwn(input, "mentoringTopics")) {
    const mentoringTopics = uniqueStrings(input.mentoringTopics);
    mentorProfileData.mentoringTopics = {
      set: [],
      connectOrCreate: mentoringTopics.map((name) => ({
        where: { name },
        create: { name },
      })),
    };
  }

  if (Object.keys(mentorProfileData).length > 0) {
    data.mentorProfile = { update: mentorProfileData };
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data,
    include: USER_INCLUDE,
  });

  return sanitizeUser(updatedUser);
}

async function updateUserProfile(userId, input) {
  const existingUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });

  if (!existingUser) {
    throw createServiceError("Authenticated user no longer exists", 401);
  }

  const data = {};
  if (Object.hasOwn(input, "fullName")) data.fullName = input.fullName.trim();
  if (Object.hasOwn(input, "jobTitle")) data.jobTitle = optionalText(input.jobTitle);
  if (Object.hasOwn(input, "workplace")) data.workplace = optionalText(input.workplace);
  if (Object.hasOwn(input, "yearsOfExperience")) {
    data.yearsOfExperience = input.yearsOfExperience === null || input.yearsOfExperience === "" ? null : Number(input.yearsOfExperience);
  }
  if (Object.hasOwn(input, "githubUrl")) data.githubUrl = optionalText(input.githubUrl);
  if (Object.hasOwn(input, "linkedinUrl")) data.linkedinUrl = optionalText(input.linkedinUrl);
  if (Object.hasOwn(input, "technologies")) {
    const technologies = uniqueStrings(input.technologies);
    data.technologies = {
      set: [],
      connectOrCreate: technologies.map((name) => ({ where: { name }, create: { name } })),
    };
  }

  const updatedUser = await prisma.user.update({ where: { id: userId }, data, include: USER_INCLUDE });
  return sanitizeUser(updatedUser);
}

module.exports = {
  createMentorProfile,
  getAllUsers,
  updateMentorProfile,
  updateUserProfile,
  validateMentorProfileCreationInput,
  validateProfileInput,
};
