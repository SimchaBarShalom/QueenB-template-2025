import { formatDate as formatDateLocale, formatDateTime as formatDateTimeLocale } from "../../i18n/locales";

export function meetingStatusLabel(status, t) {
  const value = t(`admin.status.meeting.${status}`);
  return value === `admin.status.meeting.${status}` ? status : value;
}

export function requestStatusLabel(status, t) {
  const value = t(`admin.status.request.${status}`);
  return value === `admin.status.request.${status}` ? status : value;
}

export function alertTypeLabel(type, t) {
  const value = t(`admin.status.alert.${type}`);
  return value === `admin.status.alert.${type}` ? type : value;
}

export function formatDateTime(value, language = "he") {
  return formatDateTimeLocale(value, language);
}

export function formatDate(value, language = "he") {
  return formatDateLocale(value, language);
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
