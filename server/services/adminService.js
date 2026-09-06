const prisma = require("../lib/prisma");

const ACTIVE_REQUEST_STATUSES = [
  "WAITING_FOR_MENTOR_SLOTS",
  "WAITING_FOR_MENTEE_SELECTION",
  "MATCHED",
  "ATTENDANCE_CONFIRMED",
];

const ACTIVE_MEETING_STATUSES = ["SCHEDULED", "ATTENDANCE_CONFIRMED"];
const FINAL_MEETING_STATUSES = ["COMPLETED", "NOT_COMPLETED", "CANCELLED"];
const EDITABLE_MEETING_STATUSES = ["SCHEDULED", "ATTENDANCE_CONFIRMED"];
const BULK_MEETING_STATUSES = ["COMPLETED", "NOT_COMPLETED", "CANCELLED"];
const ALERT_PRIORITIES = ["low", "normal", "high", "urgent"];

const USER_SUMMARY_SELECT = {
  id: true,
  email: true,
  fullName: true,
  jobTitle: true,
  workplace: true,
  yearsOfExperience: true,
  githubUrl: true,
  linkedinUrl: true,
  isAdmin: true,
  createdAt: true,
  updatedAt: true,
  technologies: true,
  mentorProfile: {
    include: {
      mentoringTopics: true,
    },
  },
};

const MEETING_INCLUDE = {
  request: {
    include: {
      mentee: { select: { id: true, fullName: true, email: true } },
      mentorProfile: {
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          mentoringTopics: true,
        },
      },
    },
  },
  attendanceConfirmations: {
    include: { user: { select: { id: true, fullName: true } } },
  },
  outcomeConfirmations: {
    include: { user: { select: { id: true, fullName: true } } },
  },
  feedback: {
    select: {
      id: true,
      authorId: true,
      createdAt: true,
      updatedAt: true,
      author: { select: { id: true, fullName: true } },
    },
  },
};

function parseId(value, label = "id") {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error(`Invalid ${label}`);
    error.statusCode = 400;
    throw error;
  }
  return id;
}

function statusError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeOptionalString(value) {
  if (value === undefined) return undefined;
  const trimmed = String(value).trim();
  return trimmed || null;
}

function normalizeStringList(value, label) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw statusError(`${label} must be an array`);
  }

  return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
}

function normalizeInteger(value, label, { required = false, min = 1 } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) throw statusError(`${label} is required`);
    return undefined;
  }

  const number = Number(value);
  if (!Number.isInteger(number) || number < min) {
    throw statusError(`${label} must be an integer greater than or equal to ${min}`);
  }

  return number;
}

function normalizeDate(value, label) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    throw statusError(`${label} must be a valid date`);
  }
  return date;
}

function normalizeIdList(value, label) {
  if (!Array.isArray(value) || value.length === 0) {
    throw statusError(`${label} must be a non-empty array`);
  }

  return [...new Set(value.map((item) => parseId(item, label)))];
}

function meetingStatusSkipReason(meeting, status) {
  if (!BULK_MEETING_STATUSES.includes(status)) return "סטטוס יעד לא נתמך.";
  if (meeting.status === status) return "הפגישה כבר בסטטוס הזה.";
  if (FINAL_MEETING_STATUSES.includes(meeting.status)) return "פגישות סופיות לא משתנות בפעולת אצווה.";
  return null;
}

function serializeMentorProfile(profile) {
  if (!profile) return null;

  return {
    id: profile.id,
    isActive: profile.isActive,
    background: profile.background,
    meetingCapacity: profile.meetingCapacity,
    meetingDurationMinutes: profile.meetingDurationMinutes,
    mentoringTopics: (profile.mentoringTopics || []).map((topic) => topic.name),
  };
}

function serializeUser(user, adminCount = null, currentAdminId = null) {
  const canRemoveAdmin =
    Boolean(user.isAdmin) && user.id !== currentAdminId && (adminCount === null || adminCount > 1);

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    jobTitle: user.jobTitle,
    workplace: user.workplace,
    yearsOfExperience: user.yearsOfExperience,
    githubUrl: user.githubUrl,
    linkedinUrl: user.linkedinUrl,
    technologies: (user.technologies || []).map((technology) => technology.name),
    isAdmin: user.isAdmin,
    mentorProfile: serializeMentorProfile(user.mentorProfile),
    capabilities: {
      mentee: true,
      mentor: Boolean(user.mentorProfile),
      admin: Boolean(user.isAdmin),
    },
    permissions: {
      canMakeAdmin: !user.isAdmin,
      canRemoveAdmin,
      removeAdminDisabledReason: !user.isAdmin
        ? null
        : user.id === currentAdminId
        ? "אי אפשר להסיר הרשאת מנהלת מעצמך."
        : adminCount !== null && adminCount <= 1
        ? "אי אפשר להסיר את המנהלת האחרונה במערכת."
        : null,
    },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function serializeMeeting(meeting) {
  const mentorProfile = meeting.request.mentorProfile;
  const mentor = mentorProfile.user;
  const mentee = meeting.request.mentee;
  const feedbackAuthors = meeting.feedback.map((feedback) => feedback.authorId);

  return {
    id: meeting.id,
    requestId: meeting.requestId,
    attemptNumber: meeting.attemptNumber,
    scheduledStart: meeting.scheduledStart,
    scheduledEnd: meeting.scheduledEnd,
    status: meeting.status,
    requestStatus: meeting.request.status,
    mentor: {
      id: mentor.id,
      fullName: mentor.fullName,
      email: mentor.email,
      mentorProfileId: mentorProfile.id,
      isActive: mentorProfile.isActive,
    },
    mentee: {
      id: mentee.id,
      fullName: mentee.fullName,
      email: mentee.email,
    },
    topics: mentorProfile.mentoringTopics.map((topic) => topic.name),
    attendanceConfirmations: meeting.attendanceConfirmations.map((confirmation) => ({
      id: confirmation.id,
      userId: confirmation.userId,
      userName: confirmation.user.fullName,
      status: confirmation.status,
      confirmedAt: confirmation.confirmedAt,
    })),
    outcomeConfirmations: meeting.outcomeConfirmations.map((confirmation) => ({
      id: confirmation.id,
      userId: confirmation.userId,
      userName: confirmation.user.fullName,
      occurred: confirmation.occurred,
      wantsReschedule: confirmation.wantsReschedule,
      answeredAt: confirmation.answeredAt,
    })),
    feedbackStatus: {
      count: meeting.feedback.length,
      mentorSubmitted: feedbackAuthors.includes(mentor.id),
      menteeSubmitted: feedbackAuthors.includes(mentee.id),
      submittedBy: meeting.feedback.map((feedback) => ({
        userId: feedback.authorId,
        fullName: feedback.author.fullName,
        createdAt: feedback.createdAt,
      })),
    },
    createdAt: meeting.createdAt,
    updatedAt: meeting.updatedAt,
  };
}

function buildUserWhere(query = {}) {
  const where = {};
  const search = query.search?.trim();

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { jobTitle: { contains: search, mode: "insensitive" } },
      { workplace: { contains: search, mode: "insensitive" } },
    ];
  }

  if (query.capability === "admin") {
    where.isAdmin = true;
  }

  if (query.capability === "mentor") {
    where.mentorProfile = { isNot: null };
  }

  if (query.capability === "mentee") {
    where.mentoringRequestsAsMentee = { some: {} };
  }

  return where;
}

function buildMeetingWhere(query = {}) {
  const where = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.mentorId) {
    where.request = { ...(where.request || {}), mentorProfile: { userId: parseId(query.mentorId, "mentorId") } };
  }

  if (query.menteeId) {
    where.request = { ...(where.request || {}), menteeId: parseId(query.menteeId, "menteeId") };
  }

  if (query.startDate || query.endDate) {
    where.scheduledStart = {};
    if (query.startDate) where.scheduledStart.gte = new Date(query.startDate);
    if (query.endDate) where.scheduledStart.lte = new Date(query.endDate);
  }

  if (query.noShow === "true") {
    where.status = "NOT_COMPLETED";
  }

  if (query.missingFeedback === "true") {
    where.status = "COMPLETED";
    where.feedback = { none: {} };
  }

  return where;
}

async function getAdminSummary() {
  const [
    usersCount,
    mentorsCount,
    activeMentorsCount,
    scheduledMeetingsCount,
    completedMeetingsCount,
    pendingRequestsCount,
    alerts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.mentorProfile.count(),
    prisma.mentorProfile.count({ where: { isActive: true } }),
    prisma.meeting.count({ where: { status: { in: ACTIVE_MEETING_STATUSES } } }),
    prisma.meeting.count({ where: { status: "COMPLETED" } }),
    prisma.mentoringRequest.count({ where: { status: { in: ACTIVE_REQUEST_STATUSES } } }),
    getAdminAlerts({ resolved: "unresolved" }),
  ]);

  return {
    usersCount,
    mentorsCount,
    activeMentorsCount,
    scheduledMeetingsCount,
    completedMeetingsCount,
    pendingRequestsCount,
    unresolvedAlertsCount: alerts.length,
  };
}

function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date) {
  return date.toLocaleDateString("he-IL", { month: "short", year: "2-digit" });
}

async function getAdminAnalytics(query = {}) {
  const parsedMonths = Number(query.months || 6);
  const months = [3, 6, 12].includes(parsedMonths) ? parsedMonths : 6;
  const end = new Date();
  const from = monthStart(new Date(end.getFullYear(), end.getMonth() - months + 1, 1));
  const to = new Date(end.getTime() + 1);

  const [users, requests, meetings, mentors] = await Promise.all([
    prisma.user.findMany({ where: { createdAt: { gte: from, lt: to } }, select: { createdAt: true } }),
    prisma.mentoringRequest.findMany({ where: { createdAt: { gte: from, lt: to } }, select: { createdAt: true } }),
    prisma.meeting.findMany({
      where: { scheduledStart: { gte: from, lt: to } },
      select: { scheduledStart: true, status: true, feedback: { select: { id: true } }, request: { select: { mentorProfileId: true } } },
    }),
    prisma.mentorProfile.findMany({
      where: { isActive: true },
      select: {
        id: true,
        user: { select: { fullName: true } },
        mentoringRequestsReceived: { select: { meetings: { where: { scheduledStart: { gte: from, lt: to } }, select: { status: true } } } },
      },
    }),
  ]);

  const monthly = Array.from({ length: months }, (_, index) => {
    const date = new Date(from.getFullYear(), from.getMonth() + index, 1);
    return { key: monthKey(date), label: monthLabel(date), users: 0, requests: 0, meetings: 0, completed: 0, noShows: 0 };
  });
  const monthlyByKey = new Map(monthly.map((item) => [item.key, item]));

  users.forEach(({ createdAt }) => { const item = monthlyByKey.get(monthKey(new Date(createdAt))); if (item) item.users += 1; });
  requests.forEach(({ createdAt }) => { const item = monthlyByKey.get(monthKey(new Date(createdAt))); if (item) item.requests += 1; });

  const statusCounts = {};
  let feedbackSubmitted = 0;
  meetings.forEach((meeting) => {
    const item = monthlyByKey.get(monthKey(new Date(meeting.scheduledStart)));
    if (item) {
      item.meetings += 1;
      if (meeting.status === "COMPLETED") item.completed += 1;
      if (meeting.status === "NOT_COMPLETED") item.noShows += 1;
    }
    statusCounts[meeting.status] = (statusCounts[meeting.status] || 0) + 1;
    if (meeting.status === "COMPLETED" && meeting.feedback.length) feedbackSubmitted += 1;
  });

  const mentorLoad = mentors.map((mentor) => ({
    mentorProfileId: mentor.id,
    fullName: mentor.user.fullName,
    completed: mentor.mentoringRequestsReceived.reduce(
      (count, request) => count + request.meetings.filter((meeting) => meeting.status === "COMPLETED").length,
      0
    ),
  })).sort((left, right) => right.completed - left.completed).slice(0, 8);

  return {
    period: { months, from, to },
    totals: {
      newUsers: users.length,
      newRequests: requests.length,
      meetings: meetings.length,
      completedMeetings: meetings.filter((meeting) => meeting.status === "COMPLETED").length,
      noShowMeetings: meetings.filter((meeting) => meeting.status === "NOT_COMPLETED").length,
      feedbackCompletionRate: meetings.filter((meeting) => meeting.status === "COMPLETED").length
        ? Math.round((feedbackSubmitted / meetings.filter((meeting) => meeting.status === "COMPLETED").length) * 100)
        : 0,
    },
    monthly,
    statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
    mentorLoad,
  };
}

async function listAdminUsers(query, currentAdminId) {
  const [users, adminCount] = await Promise.all([
    prisma.user.findMany({
      where: buildUserWhere(query),
      select: USER_SUMMARY_SELECT,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.user.count({ where: { isAdmin: true } }),
  ]);

  return users.map((user) => serializeUser(user, adminCount, currentAdminId));
}

async function getAdminUserDetail(userId, currentAdminId) {
  const id = parseId(userId);
  const [user, adminCount, requestCount, meetingCount, recentRequests, recentMeetings] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: USER_SUMMARY_SELECT,
    }),
    prisma.user.count({ where: { isAdmin: true } }),
    prisma.mentoringRequest.count({ where: { menteeId: id } }),
    prisma.meeting.count({
      where: {
        request: {
          OR: [{ menteeId: id }, { mentorProfile: { userId: id } }],
        },
      },
    }),
    prisma.mentoringRequest.findMany({
      where: { menteeId: id },
      include: {
        mentorProfile: { include: { user: { select: { id: true, fullName: true } } } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.meeting.findMany({
      where: {
        request: {
          OR: [{ menteeId: id }, { mentorProfile: { userId: id } }],
        },
      },
      include: MEETING_INCLUDE,
      orderBy: { scheduledStart: "desc" },
      take: 5,
    }),
  ]);

  if (!user) {
    throw statusError("User not found", 404);
  }

  return {
    user: serializeUser(user, adminCount, currentAdminId),
    counts: { requests: requestCount, meetings: meetingCount },
    recentRequests: recentRequests.map((request) => ({
      id: request.id,
      status: request.status,
      mentorName: request.mentorProfile.user.fullName,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    })),
    recentMeetings: recentMeetings.map(serializeMeeting),
  };
}

async function setUserAdminStatus(userId, isAdmin, currentAdminId) {
  const id = parseId(userId);
  const nextIsAdmin = Boolean(isAdmin);

  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    throw statusError("User not found", 404);
  }

  if (!nextIsAdmin && id === currentAdminId) {
    throw statusError("Cannot remove your own admin access", 400);
  }

  if (!nextIsAdmin && existingUser.isAdmin) {
    const adminCount = await prisma.user.count({ where: { isAdmin: true } });
    if (adminCount <= 1) {
      throw statusError("Cannot remove the last admin", 400);
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isAdmin: nextIsAdmin },
    select: USER_SUMMARY_SELECT,
  });
  const adminCount = await prisma.user.count({ where: { isAdmin: true } });

  return serializeUser(user, adminCount, currentAdminId);
}

async function setMentorVisibility(mentorProfileId, isActive) {
  const id = parseId(mentorProfileId, "mentorProfileId");
  const profile = await prisma.mentorProfile.update({
    where: { id },
    data: { isActive: Boolean(isActive) },
    include: { mentoringTopics: true },
  });

  return serializeMentorProfile(profile);
}

async function updateUserProfile(userId, input = {}, currentAdminId) {
  const id = parseId(userId);
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    throw statusError("User not found", 404);
  }

  const fullName = normalizeOptionalString(input.fullName);
  if (fullName !== undefined && (!fullName || fullName.length < 2)) {
    throw statusError("Full name must be at least 2 characters");
  }

  const yearsOfExperience = normalizeInteger(input.yearsOfExperience, "yearsOfExperience", { min: 0 });
  const technologies = normalizeStringList(input.technologies, "technologies");
  const data = {};

  if (fullName !== undefined) data.fullName = fullName;
  ["jobTitle", "workplace", "githubUrl", "linkedinUrl"].forEach((field) => {
    const value = normalizeOptionalString(input[field]);
    if (value !== undefined) data[field] = value;
  });
  if (yearsOfExperience !== undefined) data.yearsOfExperience = yearsOfExperience;
  if (technologies !== undefined) {
    data.technologies = {
      set: [],
      connectOrCreate: technologies.map((name) => ({ where: { name }, create: { name } })),
    };
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: USER_SUMMARY_SELECT,
  });
  const adminCount = await prisma.user.count({ where: { isAdmin: true } });

  return serializeUser(user, adminCount, currentAdminId);
}

async function updateMentorProfile(mentorProfileId, input = {}) {
  const id = parseId(mentorProfileId, "mentorProfileId");
  const existingProfile = await prisma.mentorProfile.findUnique({ where: { id } });
  if (!existingProfile) {
    throw statusError("Mentor profile not found", 404);
  }

  const background = normalizeOptionalString(input.background);
  if (background !== undefined && (!background || background.length < 2)) {
    throw statusError("Background must be at least 2 characters");
  }

  const meetingCapacity = normalizeInteger(input.meetingCapacity, "meetingCapacity");
  const meetingDurationMinutes = normalizeInteger(input.meetingDurationMinutes, "meetingDurationMinutes");
  const mentoringTopics = normalizeStringList(input.mentoringTopics, "mentoringTopics");
  const data = {};

  if (background !== undefined) data.background = background;
  if (meetingCapacity !== undefined) data.meetingCapacity = meetingCapacity;
  if (meetingDurationMinutes !== undefined) data.meetingDurationMinutes = meetingDurationMinutes;
  if (input.isActive !== undefined) data.isActive = Boolean(input.isActive);
  if (mentoringTopics !== undefined) {
    if (mentoringTopics.length === 0) {
      throw statusError("At least one mentoring topic is required");
    }
    data.mentoringTopics = {
      set: [],
      connectOrCreate: mentoringTopics.map((name) => ({ where: { name }, create: { name } })),
    };
  }

  const profile = await prisma.mentorProfile.update({
    where: { id },
    data,
    include: { mentoringTopics: true },
  });

  return serializeMentorProfile(profile);
}

async function listAdminMeetings(query = {}) {
  const meetings = await prisma.meeting.findMany({
    where: buildMeetingWhere(query),
    include: MEETING_INCLUDE,
    orderBy: { scheduledStart: "desc" },
    take: 200,
  });

  return meetings.map(serializeMeeting);
}

async function getAdminMeetingDetail(meetingId) {
  const id = parseId(meetingId);
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: MEETING_INCLUDE,
  });

  if (!meeting) {
    throw statusError("Meeting not found", 404);
  }

  return serializeMeeting(meeting);
}

async function updateMeetingStatus(meetingId, status) {
  const id = parseId(meetingId);
  if (!["COMPLETED", "NOT_COMPLETED", "CANCELLED"].includes(status)) {
    throw statusError("Unsupported meeting status");
  }

  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting) {
    throw statusError("Meeting not found", 404);
  }

  return prisma.$transaction(async (tx) => {
    await tx.meeting.update({
      where: { id },
      data: { status },
    });

    let requestStatus = status;
    if (status === "CANCELLED") {
      const activeSiblingCount = await tx.meeting.count({
        where: {
          requestId: meeting.requestId,
          id: { not: id },
          status: { in: ACTIVE_MEETING_STATUSES },
        },
      });

      if (activeSiblingCount === 0) {
        requestStatus = "CANCELLED";
      } else {
        requestStatus = null;
      }
    }

    if (requestStatus) {
      await tx.mentoringRequest.update({
        where: { id: meeting.requestId },
        data: { status: requestStatus },
      });
    }

    const updatedMeeting = await tx.meeting.findUnique({
      where: { id },
      include: MEETING_INCLUDE,
    });

    return serializeMeeting(updatedMeeting);
  });
}

async function bulkUpdateMeetingStatuses(input = {}) {
  const ids = normalizeIdList(input.meetingIds, "meetingIds");
  const status = input.status;
  if (!BULK_MEETING_STATUSES.includes(status)) {
    throw statusError("Unsupported meeting status");
  }

  const meetings = await prisma.meeting.findMany({
    where: { id: { in: ids } },
    include: MEETING_INCLUDE,
  });
  const meetingById = new Map(meetings.map((meeting) => [meeting.id, meeting]));
  const eligible = [];
  const skipped = [];

  ids.forEach((id) => {
    const meeting = meetingById.get(id);
    if (!meeting) {
      skipped.push({ id, reason: "הפגישה לא נמצאה." });
      return;
    }
    const reason = meetingStatusSkipReason(meeting, status);
    if (reason) skipped.push({ id, reason });
    else eligible.push(meeting);
  });

  if (input.preview) {
    return {
      preview: true,
      status,
      eligibleCount: eligible.length,
      skipped,
      eligible: eligible.map((meeting) => ({ id: meeting.id, mentorName: meeting.request.mentorProfile.user.fullName, menteeName: meeting.request.mentee.fullName })),
    };
  }

  const updated = [];
  for (const meeting of eligible) {
    // Reuse the single-record lifecycle logic so request status rules stay authoritative.
    updated.push(await updateMeetingStatus(meeting.id, status));
  }

  return { preview: false, status, updatedCount: updated.length, skipped, meetings: updated };
}

async function updateMeetingSchedule(meetingId, input = {}) {
  const id = parseId(meetingId);
  const scheduledStart = normalizeDate(input.scheduledStart, "scheduledStart");
  const scheduledEnd = normalizeDate(input.scheduledEnd, "scheduledEnd");

  if (scheduledEnd <= scheduledStart) {
    throw statusError("scheduledEnd must be after scheduledStart");
  }

  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting) {
    throw statusError("Meeting not found", 404);
  }

  if (!EDITABLE_MEETING_STATUSES.includes(meeting.status)) {
    throw statusError("Only future active meetings can be rescheduled by admin");
  }

  if (meeting.scheduledEnd <= new Date()) {
    throw statusError("Past meetings cannot be rescheduled by admin");
  }

  return prisma.$transaction(async (tx) => {
    await tx.meeting.update({
      where: { id },
      data: { scheduledStart, scheduledEnd },
    });

    if (meeting.selectedSlotId) {
      await tx.offeredSlot.update({
        where: { id: meeting.selectedSlotId },
        data: { startTime: scheduledStart, endTime: scheduledEnd },
      });
    }

    const updatedMeeting = await tx.meeting.findUnique({
      where: { id },
      include: MEETING_INCLUDE,
    });

    return serializeMeeting(updatedMeeting);
  });
}

async function cancelAdminRequest(requestId) {
  const id = parseId(requestId, "requestId");
  const request = await prisma.mentoringRequest.findUnique({
    where: { id },
    include: { meetings: true },
  });

  if (!request) {
    throw statusError("Request not found", 404);
  }

  if (!ACTIVE_REQUEST_STATUSES.includes(request.status)) {
    throw statusError("Only active requests can be cancelled");
  }

  return prisma.$transaction(async (tx) => {
    await tx.meeting.updateMany({
      where: { requestId: id, status: { in: ACTIVE_MEETING_STATUSES } },
      data: { status: "CANCELLED" },
    });

    return tx.mentoringRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  });
}

function alertKey(type, entityId) {
  return `${type}:${entityId}`;
}

function toAlert({ type, severity, title, description, entityType, entityId, materializedAt, links }) {
  return {
    key: alertKey(type, entityId),
    type,
    severity,
    title,
    description,
    entityType,
    entityId,
    materializedAt,
    links,
  };
}

async function buildRawAlerts() {
  const now = new Date();
  const staleDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const highLoadMentors = await prisma.mentorProfile.findMany({
    include: {
      user: { select: { id: true, fullName: true } },
      mentoringRequestsReceived: {
        include: { meetings: true },
      },
    },
  });

  const [noShowMeetings, missingFeedbackMeetings, staleRequests, pastPendingMeetings] = await Promise.all([
    prisma.meeting.findMany({ where: { status: "NOT_COMPLETED" }, include: MEETING_INCLUDE }),
    prisma.meeting.findMany({
      where: { status: "COMPLETED", scheduledEnd: { lte: staleDate }, feedback: { none: {} } },
      include: MEETING_INCLUDE,
    }),
    prisma.mentoringRequest.findMany({
      where: { status: { in: ["WAITING_FOR_MENTOR_SLOTS", "WAITING_FOR_MENTEE_SELECTION"] }, updatedAt: { lte: staleDate } },
      include: {
        mentee: { select: { id: true, fullName: true } },
        mentorProfile: { include: { user: { select: { id: true, fullName: true } } } },
      },
    }),
    prisma.meeting.findMany({
      where: { status: { in: ACTIVE_MEETING_STATUSES }, scheduledEnd: { lt: now } },
      include: MEETING_INCLUDE,
    }),
  ]);

  const alerts = [
    ...noShowMeetings.map((meeting) =>
      toAlert({
        type: "NO_SHOW",
        severity: "warning",
        title: "פגישה סומנה כלא התקיימה",
        description: `${meeting.request.mentee.fullName} ו-${meeting.request.mentorProfile.user.fullName}`,
        entityType: "meeting",
        entityId: meeting.id,
        materializedAt: meeting.updatedAt,
        links: { meetingId: meeting.id },
      })
    ),
    ...missingFeedbackMeetings.map((meeting) =>
      toAlert({
        type: "MISSING_FEEDBACK",
        severity: "info",
        title: "חסר פידבק אחרי פגישה שהושלמה",
        description: `${meeting.request.mentee.fullName} ו-${meeting.request.mentorProfile.user.fullName}`,
        entityType: "meeting",
        entityId: meeting.id,
        materializedAt: meeting.updatedAt,
        links: { meetingId: meeting.id, missingFeedback: true },
      })
    ),
    ...staleRequests.map((request) =>
      toAlert({
        type: "STALE_REQUEST",
        severity: "warning",
        title: "בקשה ממתינה מעל שבוע",
        description: `${request.mentee.fullName} ממתינה ל-${request.mentorProfile.user.fullName}`,
        entityType: "request",
        entityId: request.id,
        materializedAt: request.updatedAt,
        links: { requestId: request.id },
      })
    ),
    ...pastPendingMeetings.map((meeting) =>
      toAlert({
        type: "PAST_PENDING_MEETING",
        severity: "warning",
        title: "פגישה עברה ועדיין לא נסגרה",
        description: `${meeting.request.mentee.fullName} ו-${meeting.request.mentorProfile.user.fullName}`,
        entityType: "meeting",
        entityId: meeting.id,
        materializedAt: meeting.updatedAt,
        links: { meetingId: meeting.id },
      })
    ),
  ];

  highLoadMentors.forEach((profile) => {
    const completedCount = profile.mentoringRequestsReceived.reduce(
      (sum, request) => sum + request.meetings.filter((meeting) => meeting.status === "COMPLETED").length,
      0
    );

    if (completedCount >= 10) {
      alerts.push(
        toAlert({
          type: "MENTOR_LOAD",
          severity: "info",
          title: "מנטורית עם עומס פגישות גבוה",
          description: `${profile.user.fullName} השלימה ${completedCount} פגישות`,
          entityType: "mentorProfile",
          entityId: profile.id,
          materializedAt: profile.updatedAt,
          links: { userId: profile.userId },
        })
      );
    }
  });

  return alerts;
}

async function getAdminAlerts(query = {}) {
  const rawAlerts = await buildRawAlerts();
  const resolutions = await prisma.adminAlertResolution.findMany({
    where: { alertKey: { in: rawAlerts.map((alert) => alert.key) } },
    include: {
      resolvedBy: { select: { id: true, fullName: true } },
      assignedAdmin: { select: { id: true, fullName: true } },
    },
  });
  const resolutionByKey = new Map(resolutions.map((resolution) => [resolution.alertKey, resolution]));

  const alerts = rawAlerts.map((alert) => {
    const resolution = resolutionByKey.get(alert.key);
    const resolved = Boolean(resolution && resolution.materializedAt >= alert.materializedAt);
    return {
      ...alert,
      resolved,
      resolvedAt: resolved ? resolution.resolvedAt : null,
      resolvedById: resolved ? resolution.resolvedById : null,
      resolvedByName: resolved ? resolution.resolvedBy?.fullName || null : null,
      priority: resolution?.priority || "normal",
      assignedAdminId: resolution?.assignedAdminId || null,
      assignedAdminName: resolution?.assignedAdmin?.fullName || null,
      notes: resolution?.notes || "",
      queueUpdatedAt: resolution?.queueUpdatedAt || resolution?.updatedAt || null,
    };
  });

  return alerts.filter((alert) => {
    if (query.type && alert.type !== query.type) return false;
    if (query.resolved === "resolved") return alert.resolved;
    if (query.resolved === "unresolved") return !alert.resolved;
    return true;
  });
}

async function upsertAlertQueueRecord(alert, currentAdminId, data = {}) {
  const { materializedAt, ...restData } = data;
  return prisma.adminAlertResolution.upsert({
    where: { alertKey: alert.key },
    update: {
      alertType: alert.type,
      entityType: alert.entityType,
      entityId: alert.entityId,
      ...(materializedAt ? { materializedAt } : {}),
      queueUpdatedAt: new Date(),
      ...restData,
    },
    create: {
      alertKey: alert.key,
      alertType: alert.type,
      entityType: alert.entityType,
      entityId: alert.entityId,
      materializedAt: materializedAt || new Date(0),
      resolvedById: restData.resolvedById || currentAdminId,
      ...restData,
    },
  });
}

async function findRawAlert(alertKeyValue) {
  const alerts = await buildRawAlerts();
  const alert = alerts.find((item) => item.key === alertKeyValue);

  if (!alert) {
    throw statusError("Alert not found", 404);
  }

  return alert;
}

async function resolveAlert(alertKeyValue, currentAdminId) {
  const alert = await findRawAlert(alertKeyValue);
  return upsertAlertQueueRecord(alert, currentAdminId, {
    materializedAt: alert.materializedAt,
    resolvedById: currentAdminId,
    resolvedAt: new Date(),
  });
}

async function unresolveAlert(alertKeyValue) {
  await prisma.adminAlertResolution.updateMany({
    where: { alertKey: alertKeyValue },
    data: { materializedAt: new Date(0), queueUpdatedAt: new Date() },
  });
  return { alertKey: alertKeyValue };
}

async function updateAlertMetadata(alertKeyValue, input = {}, currentAdminId) {
  const alert = await findRawAlert(alertKeyValue);
  const data = {};

  if (input.priority !== undefined) {
    if (!ALERT_PRIORITIES.includes(input.priority)) throw statusError("Unsupported alert priority");
    data.priority = input.priority;
  }

  if (input.assignedAdminId !== undefined) {
    const assignedAdminId = input.assignedAdminId === null || input.assignedAdminId === "" ? null : parseId(input.assignedAdminId, "assignedAdminId");
    if (assignedAdminId) {
      const admin = await prisma.user.findUnique({ where: { id: assignedAdminId }, select: { id: true, isAdmin: true } });
      if (!admin?.isAdmin) throw statusError("Assigned user must be an admin");
    }
    data.assignedAdminId = assignedAdminId;
  }

  if (input.notes !== undefined) {
    data.notes = normalizeOptionalString(input.notes);
  }

  return upsertAlertQueueRecord(alert, currentAdminId, data);
}

async function bulkUpdateAlerts(input = {}, currentAdminId) {
  const alertKeys = Array.isArray(input.alertKeys) ? [...new Set(input.alertKeys.map((key) => String(key).trim()).filter(Boolean))] : [];
  if (!alertKeys.length) throw statusError("alertKeys must be a non-empty array");
  if (!["resolve", "reopen"].includes(input.action)) throw statusError("Unsupported alert action");

  const rawAlerts = await buildRawAlerts();
  const rawByKey = new Map(rawAlerts.map((alert) => [alert.key, alert]));
  const eligible = [];
  const skipped = [];

  alertKeys.forEach((key) => {
    const alert = rawByKey.get(key);
    if (!alert) skipped.push({ key, reason: "ההתראה לא נמצאה או כבר לא קיימת." });
    else eligible.push(alert);
  });

  if (input.preview) {
    return { preview: true, action: input.action, eligibleCount: eligible.length, skipped, eligible: eligible.map((alert) => ({ key: alert.key, title: alert.title })) };
  }

  for (const alert of eligible) {
    if (input.action === "resolve") await resolveAlert(alert.key, currentAdminId);
    else await unresolveAlert(alert.key);
  }

  return { preview: false, action: input.action, updatedCount: eligible.length, skipped };
}

async function listAdminAssignees() {
  return prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true, fullName: true, email: true },
    orderBy: { fullName: "asc" },
  });
}

module.exports = {
  cancelAdminRequest,
  bulkUpdateAlerts,
  bulkUpdateMeetingStatuses,
  getAdminAnalytics,
  getAdminAlerts,
  getAdminMeetingDetail,
  getAdminSummary,
  getAdminUserDetail,
  listAdminAssignees,
  listAdminMeetings,
  listAdminUsers,
  resolveAlert,
  setMentorVisibility,
  setUserAdminStatus,
  unresolveAlert,
  updateAlertMetadata,
  updateMeetingSchedule,
  updateMeetingStatus,
  updateMentorProfile,
  updateUserProfile,
};
