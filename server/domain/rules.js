const { ACTIVE_REQUEST_STATUSES, CAPACITY_STATUSES, isParticipant } = require("./statuses");
const { isValidPassword } = require("../utils/validation");

function hasDuplicateActiveRequest(requests, mentorId, menteeId) {
  return requests.some((request) => request.mentorId === mentorId && request.menteeId === menteeId && ACTIVE_REQUEST_STATUSES.includes(request.status));
}

function validateFutureSlots(slots, now = new Date()) {
  return slots.length > 0 && slots.every((slot) => {
    const startsAt = new Date(slot.startsAt);
    const endsAt = new Date(slot.endsAt);
    return !Number.isNaN(startsAt.getTime()) && !Number.isNaN(endsAt.getTime()) && startsAt > now && endsAt > startsAt;
  });
}

function canRequestMoreSlots(request) {
  return request.status === "SLOTS_OFFERED" && !request.extraSlotsRequested;
}

function canRequestReschedule(request, meeting) {
  return !request.rescheduleUsed && ["MATCHED", "RESCHEDULED"].includes(meeting.status);
}

function capacityUsed(meetings) {
  return meetings.filter((meeting) => CAPACITY_STATUSES.includes(meeting.status)).length;
}

function hasCapacity(mentorProfile, meetings) {
  return capacityUsed(meetings) < mentorProfile.meetingCapacity;
}

function isPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0;
}

function canSubmitMeetingFollowUp(meeting, userId) {
  return isParticipant(meeting, userId);
}

function canAccessAdmin(user) {
  return user?.role === "ADMIN";
}

module.exports = {
  canAccessAdmin,
  canRequestMoreSlots,
  canRequestReschedule,
  canSubmitMeetingFollowUp,
  capacityUsed,
  hasCapacity,
  hasDuplicateActiveRequest,
  isPositiveInteger,
  isValidPassword,
  validateFutureSlots,
};
