const test = require("node:test");
const assert = require("node:assert/strict");
const {
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
} = require("../domain/rules");

test("validates password length with letters and numbers", () => {
  assert.equal(isValidPassword("QueenB123"), true);
  assert.equal(isValidPassword("short1"), false);
  assert.equal(isValidPassword("abcdefgh"), false);
  assert.equal(isValidPassword("12345678"), false);
});

test("detects duplicate active mentee-to-mentor requests", () => {
  const requests = [
    { mentorId: 1, menteeId: 2, status: "REQUESTED" },
    { mentorId: 1, menteeId: 3, status: "CANCELLED" },
  ];
  assert.equal(hasDuplicateActiveRequest(requests, 1, 2), true);
  assert.equal(hasDuplicateActiveRequest(requests, 1, 3), false);
});

test("requires offered slots to be future ranges", () => {
  const now = new Date("2026-01-01T10:00:00Z");
  assert.equal(validateFutureSlots([{ startsAt: "2026-01-02T10:00:00Z", endsAt: "2026-01-02T11:00:00Z" }], now), true);
  assert.equal(validateFutureSlots([{ startsAt: "2025-12-31T10:00:00Z", endsAt: "2025-12-31T11:00:00Z" }], now), false);
  assert.equal(validateFutureSlots([{ startsAt: "2026-01-02T12:00:00Z", endsAt: "2026-01-02T11:00:00Z" }], now), false);
});

test("allows only one more-slots request", () => {
  assert.equal(canRequestMoreSlots({ status: "SLOTS_OFFERED", extraSlotsRequested: false }), true);
  assert.equal(canRequestMoreSlots({ status: "SLOTS_OFFERED", extraSlotsRequested: true }), false);
  assert.equal(canRequestMoreSlots({ status: "MORE_SLOTS_REQUESTED", extraSlotsRequested: false }), false);
});

test("allows only one reschedule after a matched meeting", () => {
  assert.equal(canRequestReschedule({ rescheduleUsed: false }, { status: "MATCHED" }), true);
  assert.equal(canRequestReschedule({ rescheduleUsed: true }, { status: "MATCHED" }), false);
  assert.equal(canRequestReschedule({ rescheduleUsed: false }, { status: "REQUESTED" }), false);
});

test("enforces mentor capacity using active plus completed meetings", () => {
  const meetings = [
    { status: "MATCHED" },
    { status: "COMPLETED" },
    { status: "CANCELLED" },
    { status: "NO_SHOW" },
  ];
  assert.equal(capacityUsed(meetings), 2);
  assert.equal(hasCapacity({ meetingCapacity: 3 }, meetings), true);
  assert.equal(hasCapacity({ meetingCapacity: 2 }, meetings), false);
});

test("protects admin-only access", () => {
  assert.equal(canAccessAdmin({ role: "ADMIN" }), true);
  assert.equal(canAccessAdmin({ role: "MENTOR" }), false);
  assert.equal(canAccessAdmin(null), false);
});

test("validates positive integer mentor numbers", () => {
  assert.equal(isPositiveInteger(1), true);
  assert.equal(isPositiveInteger("45"), true);
  assert.equal(isPositiveInteger(0), false);
  assert.equal(isPositiveInteger(-1), false);
  assert.equal(isPositiveInteger("abc"), false);
});

test("allows attendance and feedback only for participants", () => {
  const meeting = { mentorId: 10, menteeId: 20 };
  assert.equal(canSubmitMeetingFollowUp(meeting, 10), true);
  assert.equal(canSubmitMeetingFollowUp(meeting, 20), true);
  assert.equal(canSubmitMeetingFollowUp(meeting, 30), false);
});
