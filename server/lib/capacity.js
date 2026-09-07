const { monthRangeFor } = require("./dates");

// Meeting statuses that occupy one of the mentor's seats for the month the
// meeting is scheduled in. RESCHEDULED, CANCELLED and NOT_COMPLETED are absent
// on purpose: an unscheduled meeting releases its seat back to the pool.
const CAPACITY_MEETING_STATUSES = [
  "SCHEDULED",
  "ATTENDANCE_CONFIRMED",
  "COMPLETED",
];

function capacityWhere(mentorProfileId, { month, excludeRequestId } = {}) {
  const { start, end } = monthRangeFor(month || new Date());
  const request = { mentorProfileId };

  if (excludeRequestId) {
    request.id = { not: excludeRequestId };
  }

  return {
    request,
    status: { in: CAPACITY_MEETING_STATUSES },
    scheduledStart: { gte: start, lt: end },
  };
}

// `month` is any date inside the month being checked, defaulting to now.
async function countUsedCapacity(client, mentorProfileId, options) {
  return client.meeting.count({
    where: capacityWhere(mentorProfileId, options),
  });
}

module.exports = {
  CAPACITY_MEETING_STATUSES,
  countUsedCapacity,
};
