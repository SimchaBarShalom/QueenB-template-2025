const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { google } = require("googleapis");
const prisma = require("../lib/prisma");

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];
const CREDENTIALS_PATH = path.resolve(process.env.GOOGLE_CALENDAR_CREDENTIALS_PATH || path.join(__dirname, "..", "secrets", "credentials.json"));
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";

function serviceError(message, statusCode = 500) { const error = new Error(message); error.statusCode = statusCode; return error; }
function encryptionKey() {
  const key = Buffer.from(process.env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY || "", "base64");
  if (key.length !== 32) throw serviceError("GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.", 503);
  return key;
}
function encrypt(value) {
  const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), encrypted.toString("base64"), cipher.getAuthTag().toString("base64")].join(":");
}
function decrypt(value) {
  const [version, iv, ciphertext, tag] = value.split(":");
  if (version !== "v1" || !iv || !ciphertext || !tag) throw serviceError("Stored Google Calendar token cannot be decrypted.", 503);
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]).toString("utf8");
}
async function createOAuthClient() {
  let contents;
  try { contents = await fs.readFile(CREDENTIALS_PATH, "utf8"); } catch (error) {
    if (error.code === "ENOENT") throw serviceError("Google Calendar credentials are missing. Copy credentials.json to server/secrets/credentials.json.", 503);
    throw error;
  }
  const credentials = JSON.parse(contents); const client = credentials.installed || credentials.web;
  if (!client?.client_id || !client?.client_secret) throw serviceError("credentials.json is not a valid OAuth client file.", 503);
  const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || `http://localhost:${process.env.PORT || 5000}/api/google-calendar/oauth2/callback`;
  return new google.auth.OAuth2(client.client_id, client.client_secret, redirectUri);
}
async function saveConnection(userId, tokens) {
  const existing = await prisma.googleCalendarConnection.findUnique({ where: { userId } });
  const refreshToken = tokens.refresh_token || (existing && decrypt(existing.encryptedRefreshToken));
  if (!refreshToken) throw serviceError("Google did not return a refresh token. Revoke this app in your Google account and connect again.", 400);
  return prisma.googleCalendarConnection.upsert({
    where: { userId }, create: { userId, encryptedRefreshToken: encrypt(refreshToken), tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null },
    update: { encryptedRefreshToken: tokens.refresh_token ? encrypt(refreshToken) : undefined, tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined },
  });
}
async function getAuthorizedClient(userId) {
  const connection = await prisma.googleCalendarConnection.findUnique({ where: { userId } });
  if (!connection) throw serviceError("Connect your Google Calendar before scheduling a meeting.", 409);
  const oauth2Client = await createOAuthClient();
  oauth2Client.setCredentials({ refresh_token: decrypt(connection.encryptedRefreshToken), expiry_date: connection.tokenExpiry?.getTime() });
  oauth2Client.on("tokens", (tokens) => saveConnection(userId, tokens).catch((error) => console.error("Could not save refreshed Google Calendar token:", error)));
  return oauth2Client;
}
async function getAuthorizationUrl(state) { const client = await createOAuthClient(); return client.generateAuthUrl({ access_type: "offline", prompt: "consent", scope: SCOPES, state }); }
async function completeAuthorization({ code, userId }) { const client = await createOAuthClient(); const { tokens } = await client.getToken(code); await saveConnection(userId, tokens); }
function toEventResponse(event) {
  const meetLink = event.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri || event.hangoutLink || null;
  return { id: event.id, title: event.summary || "Untitled event", description: event.description || "", start: event.start?.dateTime || event.start?.date, end: event.end?.dateTime || event.end?.date, meetLink, conferenceStatus: event.conferenceData?.createRequest?.status?.statusCode || null, calendarLink: event.htmlLink };
}
async function waitForConference(calendar, event) {
  let latestEvent = event;
  for (let attempt = 0; attempt < 5 && !toEventResponse(latestEvent).meetLink; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    latestEvent = (await calendar.events.get({ calendarId: CALENDAR_ID, eventId: latestEvent.id, conferenceDataVersion: 1 })).data;
  }
  return latestEvent;
}
async function createCalendarEvent({ organizerUserId, title, description, start, end, attendees = [] }) {
  const calendar = google.calendar({ version: "v3", auth: await getAuthorizedClient(organizerUserId) });
  const response = await calendar.events.insert({ calendarId: CALENDAR_ID, conferenceDataVersion: 1, sendUpdates: attendees.length ? "all" : "none", requestBody: { summary: title, description, start: { dateTime: new Date(start).toISOString() }, end: { dateTime: new Date(end).toISOString() }, attendees: attendees.map((email) => ({ email })), conferenceData: { createRequest: { requestId: crypto.randomUUID() } } } });
  return toEventResponse(await waitForConference(calendar, response.data));
}
async function getUpcomingEvents(userId) {
  const calendar = google.calendar({ version: "v3", auth: await getAuthorizedClient(userId) });
  const response = await calendar.events.list({ calendarId: CALENDAR_ID, timeMin: new Date().toISOString(), maxResults: 10, singleEvents: true, orderBy: "startTime" });
  return (response.data.items || []).map(toEventResponse);
}
async function isConnected(userId) { return Boolean(await prisma.googleCalendarConnection.findUnique({ where: { userId }, select: { id: true } })); }
module.exports = { completeAuthorization, createCalendarEvent, getAuthorizationUrl, getUpcomingEvents, isConnected };
