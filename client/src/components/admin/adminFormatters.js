export const MEETING_STATUS_LABELS = {
  SCHEDULED: "נקבעה",
  ATTENDANCE_CONFIRMED: "נוכחות אושרה",
  COMPLETED: "הושלמה",
  NOT_COMPLETED: "לא התקיימה",
  RESCHEDULED: "נקבעה מחדש",
  CANCELLED: "בוטלה",
};

export const REQUEST_STATUS_LABELS = {
  WAITING_FOR_MENTOR_SLOTS: "ממתינה לזמנים מהמנטורית",
  WAITING_FOR_MENTEE_SELECTION: "ממתינה לבחירת מועד",
  REJECTED: "נדחתה",
  MATCHED: "שודכה",
  ATTENDANCE_CONFIRMED: "נוכחות אושרה",
  COMPLETED: "הושלמה",
  NOT_COMPLETED: "לא הושלמה",
  FEEDBACK_COMPLETED: "פידבק הושלם",
  CANCELLED: "בוטלה",
};

export const ALERT_TYPE_LABELS = {
  NO_SHOW: "אי הגעה",
  MISSING_FEEDBACK: "חסר פידבק",
  STALE_REQUEST: "בקשה תקועה",
  PAST_PENDING_MEETING: "פגישה לא נסגרה",
  MENTOR_LOAD: "עומס מנטורית",
};

export function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("he-IL");
}

export function getMeetingStatusColor(status) {
  if (status === "COMPLETED") return "success";
  if (status === "NOT_COMPLETED") return "warning";
  if (status === "CANCELLED") return "default";
  if (status === "ATTENDANCE_CONFIRMED") return "info";
  return "primary";
}

export function getCalendarColor(status) {
  if (status === "COMPLETED") return "#2e7d32";
  if (status === "NOT_COMPLETED") return "#ed6c02";
  if (status === "CANCELLED") return "#757575";
  if (status === "ATTENDANCE_CONFIRMED") return "#0288d1";
  return "#E6317A";
}
