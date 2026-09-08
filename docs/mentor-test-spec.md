# Mentor user-story test spec

Source of truth: current service code. Assert only behavior that exists today. Hebrew strings below are verbatim.

Planned Jest files (not created in this step):

| File | Coverage |
| --- | --- |
| `server/tests/mentorAuth.test.js` | `authService` mentor branch + `authenticate` middleware |
| `server/tests/mentorProfileService.test.js` | `usersService` mentor create/update + `mentorsService.getAllMentors` |
| `server/tests/mentoringRequestsService.test.js` | `mentoringRequestsService` |
| `server/tests/mentorMeetingsService.test.js` | `meetingsService` |

---

## Test conventions

Match `server/tests/adminService.test.js` and `server/tests/adminAuth.test.js`.

- Jest unit tests under `server/tests/`. No supertest, no test database, no new dependencies.
- `jest.mock("../lib/prisma", () => ({ ... }))` with inline `jest.fn()` delegates.
- `jest.clearAllMocks()` in `beforeEach`.
- `jest.mock("../services/emailService")` in any file that loads a module which `require`s `emailService` (otherwise nodemailer opens a real Gmail connection at module load). `mentoringRequestsService` and `meetingsService` both do.
- `$transaction` mocks must tolerate a **second argument**. `meetingsService.createMeetingFromSlot` calls `$transaction(cb, { isolationLevel: "Serializable" })`. Ignore the options object and invoke the callback:

```js
prisma.$transaction.mockImplementation(async (callback) =>
  callback({
    mentoringRequest: {
      count: prisma.mentoringRequest.count,
      updateMany: prisma.mentoringRequest.updateMany,
    },
    meeting: { create: prisma.meeting.create },
    notification: { create: prisma.notification.create },
  })
);
```

- Thrown service errors: `error.statusCode` plus `error.message` (use `rejects.toMatchObject({ statusCode, message })` or equivalent).
- Validation helpers (`validateRegistrationInput`, `validateProfileInput`, …) return a **string array**; they do not set `statusCode`. HTTP mapping today is `400` + `{ errors }` on the route. Assert the array contents.
- `authenticate` writes `res.status(code).json({ error })` and does not throw.
- Set `process.env.JWT_SECRET` **before** requiring modules that read it (`adminAuth.test.js` style).
- `mentoringRequestsService.test.js` must `jest.mock("../services/meetingsService")` so `selectMentoringRequestSlot` does not run real meeting logic.

---

## 1. `server/services/authService.js` + `server/middleware/authenticate.js`

**Planned file:** `server/tests/mentorAuth.test.js`

### Functions under test

- `validateRegistrationInput`
- `registerUser` (mentor branch: `wantsToBeMentor === true`)
- `loginUser`
- `sanitizeUser` (via register/login return value)
- `authenticate` (`server/middleware/authenticate.js`)
- JWT shape via `createAuthToken` in `server/services/authTokenService.js` (`jwt.sign({ userId }, secret, { expiresIn: "7d" })`)

### Prisma / other mocks

- `user.create`
- `user.findUnique`
- `jest.mock("bcryptjs")` optional; otherwise spy `bcrypt.hash` / `bcrypt.compare`
- Do **not** mock prisma for `authenticate`; mock `../services/authTokenService` or sign real tokens with `JWT_SECRET`

### Cases

#### `validateRegistrationInput` (mentor flags; route would return 400 `{ errors }`)

1. `wantsToBeMentor: true` and missing/empty `mentoringTopics` → errors include `"At least one mentoring topic is required for mentors"`.
2. `wantsToBeMentor: true` and `meetingCapacity` missing, `0`, or negative → errors include `"Meeting capacity is required for mentors"` (`!meetingCapacity || Number(meetingCapacity) <= 0`).
3. `wantsToBeMentor: true` and `meetingDurationMinutes` missing, `0`, or negative → errors include `"Meeting duration is required for mentors"`.
4. Multiple mentor field failures accumulate in the **same** `errors` array (plus any base name/email/password errors).

#### `registerUser` (mentor)

5. `email` is stored as `input.email.trim().toLowerCase()`.
6. `fullName` is `` `${firstName.trim()} ${lastName.trim()}` ``.
7. Password hashed with `bcrypt.hash(password, 10)` (cost factor **10**).
8. Mentoring topics: `trim`, drop empties, `connectOrCreate` `{ where: { name }, create: { name } }`.
9. `background` when both `jobTitle` and `workplace` are non-empty after trim: `` `${jobTitle} — ${workplace}` `` (em dash `—`, U+2014, spaces around it).
10. `background` when only `jobTitle`: that string; only `workplace`: that string; neither: `"לא צוין"`.
11. `meetingCapacity` / `meetingDurationMinutes` passed as `Number(...)`.
12. Returned user is sanitized: no `passwordHash`; `mentorProfile.mentoringTopics` is an array of **names**.

#### `loginUser` / token

13. Unknown email (`findUnique` → `null`) → `loginUser` returns `null` (route maps this to 401 `"Invalid email or password"`; assert `null` at service level).
14. Known email, `bcrypt.compare` false → `null`.
15. Mentor with `mentorProfile.isActive: false` still returns a sanitized user (no `isActive` check in `loginUser`).
16. `createAuthToken(userId)` payload is `{ userId }` only (no role/email).

#### `authenticate`

17. Missing `Authorization` header, empty, or not `Bearer <token>` (case-insensitive `^Bearer\s+(.+)$`) → **401** `{ error: "Authentication required" }`, `next` not called.
18. Token verifies but `payload.userId` is not an integer (string, float, missing) → **401** `{ error: "Invalid authentication token" }`.
19. `JsonWebTokenError` → **401** `{ error: "Invalid authentication token" }`.
20. `TokenExpiredError` → **401** `{ error: "Authentication token expired" }`.
21. Valid integer `userId` → `req.auth = { userId }`, `next()` called, no error body.

---

## 2. `server/services/usersService.js` + `server/services/mentorsService.js`

**Planned file:** `server/tests/mentorProfileService.test.js`

### Functions under test

- `validateProfileInput`
- `validateMentorProfileCreationInput`
- `createMentorProfile`
- `updateMentorProfile`
- `getAllMentors`

### Prisma delegates

- `user.findUnique`
- `user.update`
- `user.findMany` (`getAllMentors`)

No `emailService` import on these modules.

### Cases

#### Validation (route would return 400 `{ errors }`)

1. `meetingCapacity` present but not an integer in 1–100 (e.g. `0`, `101`, `1.5`, `"abc"`) → `"Meeting capacity must be a whole number between 1 and 100"`.
2. `meetingDurationMinutes` present but not in `[30, 45, 60, 90]` → `"Meeting duration must be 30, 45, 60, or 90 minutes"`.
3. `validateMentorProfileCreationInput` missing `fullName` / `background` / `mentoringTopics` / `meetingCapacity` / `meetingDurationMinutes` → `"${field} is required to create a mentor profile"` per missing field.
4. `mentoringTopics` present but empty or not a valid string list → `"At least one mentoring topic is required"`.

#### `createMentorProfile`

5. `user.findUnique` → `null` → throw **401** `"Authenticated user no longer exists"`.
6. Existing `mentorProfile` → throw **409** `"A mentor profile already exists"`.
7. Topics/technologies: `uniqueStrings` — trim, drop empties, **dedupe**; `connectOrCreate` on the unique list. `technologies` uses `set: []` then `connectOrCreate`.
8. Success path: `user.update` with nested `mentorProfile.create` (`background.trim()`, numeric capacity/duration).

#### `updateMentorProfile`

9. No user → **401** `"Authenticated user no longer exists"`.
10. User without `mentorProfile` → **403** `"Only mentors can update a mentor profile"`.
11. Topic update: same trim/dedup as create; nested `mentorProfile.update` with `mentoringTopics: { set: [], connectOrCreate }`.
12. Mentor-only fields (`background`, `meetingCapacity`, `meetingDurationMinutes`, `mentoringTopics`) go on `data.mentorProfile.update`; base fields stay on `user`.

#### `getAllMentors`

13. `findMany` `where.mentorProfile.is.isActive` is `true` (inactive mentors excluded).
14. `orderBy: { fullName: "asc" }`.
15. Mapped object has `id`, `fullName`, `jobTitle`, `workplace`, `yearsOfExperience`, `githubUrl`, `linkedinUrl`, `technologies` (names), `mentorProfileId`, `background`, `meetingCapacity`, `meetingDurationMinutes`, `mentoringTopics` (names). **No** `email`, **no** `passwordHash`.

---

## 3. `server/services/mentoringRequestsService.js`

**Planned file:** `server/tests/mentoringRequestsService.test.js`

### Functions under test

- `createMentoringRequest`
- `getMentoringRequestsByMentorUser`
- `offerMentoringRequestSlots`
- `rejectMentoringRequest`
- `offerRescheduleSlots`
- `declineOfferedSlots`
- `cancelMentoringRequest`

(`selectMentoringRequestSlot` only needs a mock of `createMeetingFromSlot`; meeting rules live in section 4.)

### Prisma delegates

- `meeting.findFirst`
- `mentoringRequest.findFirst`
- `mentoringRequest.create`
- `mentoringRequest.findMany`
- `mentoringRequest.findUnique`
- `mentoringRequest.update`
- `mentoringRequest.updateMany` (via `$transaction`)
- `mentoringRequest.count`
- `mentorProfile.findUnique`
- `user.findUnique` (email helper)
- `schedulingRound.create`
- `meeting.update`
- `notification.create`
- `$transaction`

Also mock `../services/emailService` (`sendEmail`) and `../services/meetingsService`.

### Cases

#### `createMentoringRequest`

1. Existing meeting with `status` in `["SCHEDULED", "ATTENDANCE_CONFIRMED"]` for this mentee (any mentor) → **409** `"יש לך כבר פגישה פעילה. כדי לקבוע פגישה חדשה, בטלי קודם את הפגישה הקיימת."` (checked **before** duplicate-request logic).
2. Active request to the same mentor (`status` in `WAITING_FOR_MENTOR_SLOTS`, `WAITING_FOR_MENTEE_SELECTION`, `MATCHED`, `ATTENDANCE_CONFIRMED`) → **409** `"כבר קיימת בקשה פעילה עם מנטורית זו"`.
3. Monthly block: `CANCELLED` this calendar month (`updatedAt` in `[start, end)` of current month) **and** a scheduling round `type: "EXTRA_SLOTS"` **and** an in-app notification `type: "RESCHEDULE_REQUIRED"` → **409** `"לא ניתן לקבוע פגישה חדשה עם מנטורית זו עד החודש הבא"`. All three conditions required.
4. Success: create with `status: "WAITING_FOR_MENTOR_SLOTS"`.
5. `sendEmail` rejection / throw inside `sendMentoringRequestEmails` does **not** fail the request (errors are caught; created request is still returned).

#### `getMentoringRequestsByMentorUser`

6. `mentorProfile.findUnique` by `userId` returns `null` → **403** `"Only mentors can access mentor meetings"`.

#### `offerMentoringRequestSlots`

7. Capacity: `mentoringRequest.count` with `status` in `["MATCHED", "ATTENDANCE_CONFIRMED", "COMPLETED", "FEEDBACK_COMPLETED"]` ≥ `meetingCapacity` → **409** `"הגעת למכסת הפגישות שלך"`. This runs **before** slot validation (invalid slots must not be reached if capacity is full).
8. Slots not an array, empty, or length `> 10` → **400** `"Provide between 1 and 10 time slots"`.
9. Invalid dates or `startTime.getTime() <= Date.now()` (past or now) → **400** `"Every slot must have a valid future start and end time"`.
10. Duration ≠ `mentorProfile.meetingDurationMinutes` → **400** `` `Every slot must be exactly ${meetingDurationMinutes} minutes` `` (interpolate the profile value).
11. After sort by start: `normalized[i].startTime < normalized[i-1].endTime` → **400** `"Offered time slots cannot overlap"`. **Touching** slots (`start === previous end`) are allowed.
12. Normalized slots are sorted by `startTime` ascending before create.
13. `roundNumber === 1` → round `type: "INITIAL"`; `roundNumber === 2` (existing latest roundNumber 1) → `"EXTRA_SLOTS"`.
14. Transaction `updateMany` where status is `WAITING_FOR_MENTOR_SLOTS`; `count !== 1` → **409** `"This request was already handled"`.
15. Not owned / missing request (`getOwnedPendingRequest`) → **404** `"Mentoring request not found"`.
16. Owned but status ≠ `WAITING_FOR_MENTOR_SLOTS` → **409** `"This request is no longer waiting for mentor action"`.

#### `rejectMentoringRequest`

17. Only from `WAITING_FOR_MENTOR_SLOTS` (same `getOwnedPendingRequest` 404/409 as 15–16).
18. Success: `status: "REJECTED"`.

#### `offerRescheduleSlots`

19. No matching request (`status` not in `MATCHED` / `ATTENDANCE_CONFIRMED`, or not this mentor) → **409** `"This meeting cannot be rescheduled"`.
20. Any existing round `type: "RESCHEDULE_BEFORE_MEETING"` → **409** `"The meeting has already been rescheduled once"` (once only).
21. No current meeting in `SCHEDULED` / `ATTENDANCE_CONFIRMED`, or `scheduledStart <= now` → **409** `"Only an upcoming meeting can be rescheduled"`.
22. Success: old meeting `status: "RESCHEDULED"`; new round `type: "RESCHEDULE_BEFORE_MEETING"`; in-app notification `type: "RESCHEDULE_REQUIRED"` with `recipientId: request.menteeId`.
23. `updateMany` `count !== 1` → **409** `"This meeting was already changed"`.

#### `declineOfferedSlots`

24. Not `WAITING_FOR_MENTEE_SELECTION` / wrong mentee → **409** `"This request is not waiting for a time selection"`.
25. First decline (no `EXTRA_SLOTS` round) → request status `"WAITING_FOR_MENTOR_SLOTS"`; creates `RESCHEDULE_REQUIRED` to `mentorProfile.userId`.
26. Decline when a round `type === "EXTRA_SLOTS"` already exists → `"CANCELLED"`.

#### `cancelMentoringRequest`

27. Only `WAITING_FOR_MENTOR_SLOTS` or `WAITING_FOR_MENTEE_SELECTION` for that `menteeId`; otherwise **409** `"Mentoring request cannot be cancelled"`.
28. Success: `status: "CANCELLED"`.

---

## 4. `server/services/meetingsService.js`

**Planned file:** `server/tests/mentorMeetingsService.test.js`

### Functions under test

- `createMeetingFromSlot`
- `confirmMeetingOutcome`
- `submitMeetingFeedback`

(`cancelMeeting` is mentee-side; not required for the mentor-story file unless needed as setup.)

### Prisma delegates

- `mentoringRequest.findFirst`
- `meeting.findFirst`
- `mentoringRequest.count` (inside `$transaction`)
- `mentoringRequest.updateMany`
- `mentoringRequest.update`
- `meeting.create`
- `meeting.findUnique`
- `meeting.update`
- `notification.create`
- `meetingOutcomeConfirmation.create`
- `feedback.create`
- `$transaction` (**must accept isolation options as second arg**)

Mock `../services/emailService`. Email failure after a successful transaction must not throw (caught in `sendMeetingScheduledEmails`).

### Cases

#### `createMeetingFromSlot`

1. Request missing, wrong `menteeId`, or status ≠ `WAITING_FOR_MENTEE_SELECTION` → **409** `"This request is not waiting for your time selection"`.
2. `slotId` not in the **latest** round’s `offeredSlots` → **400** `"The selected time is not part of the latest offer"`.
3. Slot `startTime <= now` → **409** `"The selected time is no longer available"`.
4. Mentee already has another meeting `SCHEDULED` or `ATTENDANCE_CONFIRMED` → **409** `"יש לך כבר פגישה פעילה. כדי לקבוע פגישה חדשה, בטלי קודם את הפגישה הקיימת."`.
5. Capacity count uses `id: { not: request.id }` and statuses `MATCHED`, `ATTENDANCE_CONFIRMED`, `COMPLETED`, `FEEDBACK_COMPLETED`. If `usedCapacity >= meetingCapacity` → **409** `"המנטורית הגיעה למכסת הפגישות שלה"`.
6. `updateMany` `count !== 1` → **409** `"This request was already handled"`.
7. Success: request status `"MATCHED"`; meeting `status: "SCHEDULED"`; `attemptNumber` is `(latest attempt or 0) + 1`; notification `type: "MEETING_MATCHED"`, `channel: "IN_APP"`, `recipientId: request.mentorProfile.userId`.
8. `$transaction` is invoked with `{ isolationLevel: "Serializable" }` as the second argument.

#### `confirmMeetingOutcome`

9. `occurred` not a boolean (`undefined`, `"true"`, `1`) → **400** `"occurred must be true or false"`.
10. Meeting not found for this user as mentee **or** mentor (`getParticipantMeeting`) → **404** `"Meeting not found"` (third party).
11. `scheduledEnd > now` → **409** `"The meeting outcome can only be confirmed after it ends"`.
12. Same `userId` already in `outcomeConfirmations` → **409** `"You already confirmed this meeting outcome"`.
13. First confirmation: if current meeting status is not already `COMPLETED` or `NOT_COMPLETED`, set meeting **and** request to `"COMPLETED"` (`occurred: true`) or `"NOT_COMPLETED"` (`occurred: false`).
14. Later confirmation that disagrees does **not** change status when meeting is already `COMPLETED` or `NOT_COMPLETED` (still inserts a confirmation row).
15. Always writes `meetingOutcomeConfirmation` with `wantsReschedule: false`.

#### `submitMeetingFeedback`

16. Rating not an integer 1–5 → **400** `"Rating must be a whole number between 1 and 5"`.
17. Meeting status ≠ `COMPLETED` → **409** `"Feedback is available only after a completed meeting"`.
18. `feedback` already has this `authorId` → **409** `"You already submitted feedback for this meeting"`.
19. Non-participant → **404** `"Meeting not found"`.
20. `answers.text` is `text.trim().slice(0, 1000)` when `text` is a string; otherwise `""`. Rating stored as integer in `answers.rating`.

---

## Known gaps, not tested

These are product/schema gaps, not missing assertions for current code. Do not write tests that expect the missing behavior.

- **No `meetingLink` field.** Spec (`docs/mvp-plan/spec.md`) mentions `meetingLink` on `MentorProfile` and `Meeting`. It is absent from `schema.prisma`, registration, profile update, and meeting create. Mentors cannot store or share a meeting URL.
- **Mentee-side reschedule missing.** Only the mentor can offer reschedule slots (`offerRescheduleSlots` keyed by `mentorProfile.userId`). There is no mentee API/service to start a reschedule.
- **Unauthenticated `menteeId`-in-body endpoints.** These routes do not use `authenticate` and trust `menteeId` from the body or path: `POST /` (create request), `GET /mentee/:menteeId`, `PATCH /:requestId/decline-slots`, `PATCH /:requestId/cancel` on mentoring requests; `POST /select-slot` and `PATCH /:meetingId/cancel` on meetings. Unit tests of services will keep taking `menteeId` as an argument; they should not pretend auth exists.
- **`AttendanceConfirmation` never written.** The Prisma model exists (`AttendanceConfirmation` / `AttendanceStatus`). No service creates rows. `confirmMeetingOutcome` writes `MeetingOutcomeConfirmation` only. Do not expect attendance rows or `ATTENDANCE_CONFIRMED` request/meeting transitions from these services.
- **`FEEDBACK_COMPLETED` never set.** The enum value exists and is listed in capacity-status arrays, but `submitMeetingFeedback` only `feedback.create`s. Request/meeting status is never updated to `FEEDBACK_COMPLETED`.
- **Orphaned `capacityOverride` migration absent from `schema.prisma`.** `server/prisma/migrations/20260907182237_add_capacity_override/migration.sql` adds `MentoringRequest.capacityOverride`, but `MentorProfile` / `MentoringRequest` in `schema.prisma` have no such field. Services do not read or write it. Do not mock or assert `capacityOverride`.
