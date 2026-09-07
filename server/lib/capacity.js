const CAPACITY_STATUSES = [
  "MATCHED",
  "ATTENDANCE_CONFIRMED",
  "COMPLETED",
  "FEEDBACK_COMPLETED",
];

async function countUsedCapacity(client, mentorProfileId, excludeRequestId) {
  const where = {
    mentorProfileId,
    status: { in: CAPACITY_STATUSES },
  };

  if (excludeRequestId) {
    where.id = { not: excludeRequestId };
  }

  return client.mentoringRequest.count({ where });
}

module.exports = {
  CAPACITY_STATUSES,
  countUsedCapacity,
};
