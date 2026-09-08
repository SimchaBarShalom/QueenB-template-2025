const express = require("express");
const crypto = require("crypto");
const { requireAuth } = require("../middleware/auth");
const { completeAuthorization, createCalendarEvent, getAuthorizationUrl, getUpcomingEvents, isConnected } = require("../services/googleCalendarService");
const router = express.Router();
const pendingAuthorizationStates = new Map();
const STATE_TTL_MS = 10 * 60 * 1000;
function handleError(error, res, next) { if (error.statusCode) return res.status(error.statusCode).json({ error: error.message }); return next(error); }
function requireMentor(req, res, next) { if (!req.user?.mentorProfile) return res.status(403).json({ error: "Only mentors can connect a Google Calendar." }); return next(); }
function validateEventInput({ title, start, end, attendees }) {
  if (typeof title !== "string" || !title.trim() || !start || !end) return "title, start, and end are required";
  const startDate = new Date(start); const endDate = new Date(end);
  if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf()) || endDate <= startDate) return "start and end must be valid ISO 8601 date-times, with end after start";
  if (attendees !== undefined && (!Array.isArray(attendees) || attendees.some((email) => typeof email !== "string"))) return "attendees must be an array of email addresses";
  return null;
}
router.get("/status", requireAuth, requireMentor, async (req, res, next) => { try { return res.json({ connected: await isConnected(req.user.id) }); } catch (error) { return handleError(error, res, next); } });
router.get("/connect", requireAuth, requireMentor, async (req, res, next) => { try { const state = crypto.randomBytes(32).toString("hex"); pendingAuthorizationStates.set(state, { userId: req.user.id, expiresAt: Date.now() + STATE_TTL_MS }); return res.json({ authorizationUrl: await getAuthorizationUrl(state) }); } catch (error) { return handleError(error, res, next); } });
router.get("/oauth2/callback", async (req, res, next) => { try { if (req.query.error) return res.status(400).send("Google Calendar authorization was cancelled."); if (!req.query.code || typeof req.query.code !== "string") return res.status(400).send("Google Calendar authorization code is missing."); const pendingAuthorization = typeof req.query.state === "string" ? pendingAuthorizationStates.get(req.query.state) : null; pendingAuthorizationStates.delete(req.query.state); if (!pendingAuthorization || pendingAuthorization.expiresAt < Date.now()) return res.status(400).send("Google Calendar authorization state is invalid or expired. Start the connection again."); await completeAuthorization({ code: req.query.code, userId: pendingAuthorization.userId }); return res.send("Your Google Calendar is connected. You can close this tab and return to Queen Match."); } catch (error) { return handleError(error, res, next); } });
router.post("/events", requireAuth, requireMentor, async (req, res, next) => { try { const validationError = validateEventInput(req.body); if (validationError) return res.status(400).json({ error: validationError }); const event = await createCalendarEvent({ organizerUserId: req.user.id, title: req.body.title.trim(), description: typeof req.body.description === "string" ? req.body.description : "", start: req.body.start, end: req.body.end, attendees: req.body.attendees || [] }); return res.status(201).json(event); } catch (error) { return handleError(error, res, next); } });
router.get("/events/upcoming", requireAuth, requireMentor, async (req, res, next) => { try { return res.json({ events: await getUpcomingEvents(req.user.id) }); } catch (error) { return handleError(error, res, next); } });
module.exports = router;
