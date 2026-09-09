const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const prisma = require("../lib/prisma");
const { sanitizeUser } = require("./authService");

const STATE_TTL_MS = 10 * 60 * 1000;
const HANDOFF_TTL_MS = 5 * 60 * 1000;
const states = new Map();
const handoffs = new Map();
const SCOPES = ["openid", "email", "profile"];

function configuredClient() {
  const { google } = require("googleapis");
  let clientId = process.env.GOOGLE_AUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  let clientSecret = process.env.GOOGLE_AUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const credentialsPath = process.env.GOOGLE_AUTH_CREDENTIALS_PATH || path.join(__dirname, "..", "secrets", "credentials.json");
    try {
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
      const client = credentials.web || credentials.installed;
      clientId ||= client?.client_id;
      clientSecret ||= client?.client_secret;
    } catch (_) { /* handled below */ }
  }
  if (!clientId || !clientSecret) {
    const error = new Error("Google sign-in is not configured"); error.statusCode = 503; throw error;
  }
  const redirectUri = process.env.GOOGLE_AUTH_REDIRECT_URI || `http://localhost:${process.env.PORT || 5000}/api/auth/google/callback`;
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function prune() {
  const now = Date.now();
  for (const [key, value] of states) if (value.expiresAt < now) states.delete(key);
  for (const [key, value] of handoffs) if (value.expiresAt < now) handoffs.delete(key);
}

async function getGoogleAuthorizationUrl() {
  prune();
  const state = crypto.randomBytes(32).toString("hex");
  states.set(state, { expiresAt: Date.now() + STATE_TTL_MS });
  return { state, authorizationUrl: configuredClient().generateAuthUrl({ access_type: "offline", scope: SCOPES, state, prompt: "select_account" }) };
}

async function verifyGoogleCode(code) {
  if (!code || typeof code !== "string") { const e = new Error("Google authorization code is missing"); e.statusCode = 400; throw e; }
  const client = configuredClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) { const e = new Error("Google did not return an identity token"); e.statusCode = 400; throw e; }
  const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: client._clientId });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || payload.email_verified !== true || payload.iss !== "https://accounts.google.com") {
    const e = new Error("Google account could not be verified"); e.statusCode = 401; throw e;
  }
  return { subject: payload.sub, email: payload.email.trim().toLowerCase(), fullName: payload.name || payload.email.split("@")[0] };
}

function createHandoff(value) {
  const code = crypto.randomBytes(32).toString("hex");
  handoffs.set(code, { ...value, expiresAt: Date.now() + HANDOFF_TTL_MS });
  return code;
}

function consumeHandoff(code) {
  prune();
  const value = handoffs.get(code);
  handoffs.delete(code);
  if (!value || value.expiresAt < Date.now()) { const e = new Error("Google sign-in session expired"); e.statusCode = 400; throw e; }
  return value;
}

async function completeGoogleSignIn(identity, role, details = {}) {
  const existing = await findExistingUser(identity);
  if (existing) {
    if (!existing.googleSubject) await prisma.user.update({ where: { id: existing.id }, data: { googleSubject: identity.subject } });
    return sanitizeUser({ ...existing, googleSubject: identity.subject });
  }
  if (role !== "mentee" && role !== "mentor") { const e = new Error("Choose mentee or mentor"); e.statusCode = 400; throw e; }
  const parts = identity.fullName.trim().split(/\s+/); const firstName = parts.shift() || "Queen"; const lastName = parts.join(" ") || "B";
  const background = typeof details.background === "string" && details.background.trim().length >= 2 ? details.background.trim() : "לא צוין";
  const data = { email: identity.email, googleSubject: identity.subject, passwordHash: null, fullName: `${firstName} ${lastName}`, background };
  if (role === "mentor") {
    const topics = Array.isArray(details.mentoringTopics) ? details.mentoringTopics.map(String).map((v) => v.trim()).filter(Boolean) : [];
    if (!topics.length || Number(details.meetingCapacity) <= 0 || Number(details.meetingDurationMinutes) <= 0) { const e = new Error("Mentor details are incomplete"); e.statusCode = 400; throw e; }
    data.jobTitle = details.jobTitle?.trim() || null; data.workplace = details.workplace?.trim() || null;
    data.mentorProfile = { create: { background, meetingCapacity: Number(details.meetingCapacity), meetingDurationMinutes: Number(details.meetingDurationMinutes), mentoringTopics: { connectOrCreate: topics.map((name) => ({ where: { name }, create: { name } })) } } };
  }
  const user = await prisma.user.create({ data, include: { technologies: true, mentorProfile: { include: { mentoringTopics: true } } } });
  return sanitizeUser(user);
}

async function findExistingUser(identity) {
  return prisma.user.findFirst({ where: { OR: [{ googleSubject: identity.subject }, { email: identity.email }] }, include: { technologies: true, mentorProfile: { include: { mentoringTopics: true } } } });
}

module.exports = { getGoogleAuthorizationUrl, verifyGoogleCode, createHandoff, consumeHandoff, completeGoogleSignIn, findExistingUser, states, handoffs };
