const express = require("express");
const { requireAdmin, requireAuth } = require("../middleware/auth");
const adminService = require("../services/adminService");

const router = express.Router();

router.use(requireAuth, requireAdmin);

function handleAdminError(error, next, res) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  return next(error);
}

router.get("/summary", async (req, res, next) => {
  try {
    return res.json(await adminService.getAdminSummary());
  } catch (error) {
    return handleAdminError(error, next, res);
  }
});

router.get("/analytics", async (req, res, next) => {
  try {
    return res.json(await adminService.getAdminAnalytics(req.query));
  } catch (error) {
    return handleAdminError(error, next, res);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    return res.json(await adminService.listAdminUsers(req.query, req.user.id));
  } catch (error) {
    return handleAdminError(error, next, res);
  }
});

router.get("/users/:id", async (req, res, next) => {
  try {
    return res.json(await adminService.getAdminUserDetail(req.params.id, req.user.id));
  } catch (error) {
    return handleAdminError(error, next, res);
  }
});

router.patch("/users/:id/admin", async (req, res, next) => {
  try {
    return res.json(await adminService.setUserAdminStatus(req.params.id, req.body.isAdmin, req.user.id));
  } catch (error) {
    return handleAdminError(error, next, res);
  }
});

router.patch("/users/:id/profile", async (req, res, next) => {
  try {
    return res.json(await adminService.updateUserProfile(req.params.id, req.body, req.user.id));
  } catch (error) {
    return handleAdminError(error, next, res);
  }
});

router.patch("/mentors/:mentorProfileId/visibility", async (req, res, next) => {
  try {
    return res.json(await adminService.setMentorVisibility(req.params.mentorProfileId, req.body.isActive));
  } catch (error) {
    return handleAdminError(error, next, res);
  }
});

router.patch("/mentors/:mentorProfileId/profile", async (req, res, next) => {
  try {
    return res.json(await adminService.updateMentorProfile(req.params.mentorProfileId, req.body));
  } catch (error) {
    return handleAdminError(error, next, res);
  }
});

router.get("/meetings", async (req, res, next) => {
  try {
    return res.json(await adminService.listAdminMeetings(req.query));
  } catch (error) {
    return handleAdminError(error, next, res);
  }
});

router.get("/meetings/:id", async (req, res, next) => {
  try {
    return res.json(await adminService.getAdminMeetingDetail(req.params.id));
  } catch (error) {
    return handleAdminError(error, next, res);
  }
});

router.patch("/meetings/:id/status", async (req, res, next) => {
  try {
    return res.json(await adminService.updateMeetingStatus(req.params.id, req.body.status));
  } catch (error) {
    return handleAdminError(error, next, res);
  }
});

router.patch("/meetings/:id/schedule", async (req, res, next) => {
  try {
    return res.json(await adminService.updateMeetingSchedule(req.params.id, req.body));
  } catch (error) {
    return handleAdminError(error, next, res);
  }
});

router.patch("/requests/:id/cancel", async (req, res, next) => {
  try {
    return res.json(await adminService.cancelAdminRequest(req.params.id));
  } catch (error) {
    return handleAdminError(error, next, res);
  }
});

router.get("/alerts", async (req, res, next) => {
  try {
    return res.json(await adminService.getAdminAlerts(req.query));
  } catch (error) {
    return handleAdminError(error, next, res);
  }
});

router.patch("/alerts/:alertKey/resolve", async (req, res, next) => {
  try {
    return res.json(await adminService.resolveAlert(req.params.alertKey, req.user.id));
  } catch (error) {
    return handleAdminError(error, next, res);
  }
});

router.patch("/alerts/:alertKey/unresolve", async (req, res, next) => {
  try {
    return res.json(await adminService.unresolveAlert(req.params.alertKey));
  } catch (error) {
    return handleAdminError(error, next, res);
  }
});

module.exports = router;
