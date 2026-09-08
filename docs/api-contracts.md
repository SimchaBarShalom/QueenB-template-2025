# Queens Match API Contracts

## Current Base API

The current base implementation uses Express, Prisma, PostgreSQL, and JSON responses.

Base URL in local development:

```text
http://localhost:5000
```

When the React client runs through Create React App, API calls may use relative paths such as `/api/auth/login` because `client/package.json` proxies to the server.

## General Rules

- Request and response bodies are JSON.
- Dates are ISO 8601 strings.
- Password hashes must never be returned.
- Errors use one of these shapes:

```json
{
  "error": "Human readable message"
}
```

```json
{
  "errors": ["First validation error", "Second validation error"]
}
```

## Roles and Capabilities

The database does not store a single role enum on `User`. Capabilities are derived from these fields:

```text
Mentee: every registered user can act as a mentee
Mentor: User has a MentorProfile row
Admin: User.isAdmin is true
```

Admin users can be created through seed data or through the admin user-management API. Removing admin access is blocked when the target is the current admin or the last remaining admin.

## User Object

Safe user responses use this shape:

```json
{
  "id": 1,
  "email": "mentee@queenb.org",
  "fullName": "Example Mentee",
  "jobTitle": "Junior Developer",
  "workplace": "QueenB Bootcamp",
  "yearsOfExperience": 1,
  "githubUrl": null,
  "linkedinUrl": null,
  "technologies": ["React"],
  "isAdmin": false,
  "mentorProfile": null,
  "createdAt": "2026-09-03T12:00:00.000Z"
}
```

Do not expose:

```text
passwordHash
```

## Health

### `GET /api/health`

Response `200`:

```json
{
  "message": "QueenB Server is running!",
  "timestamp": "2026-09-03T12:00:00.000Z",
  "status": "healthy"
}
```

## Auth

### `POST /api/auth/register`

Registers a mentee or mentor.

Request:

```json
{
  "firstName": "Dana",
  "lastName": "Levi",
  "email": "dana@example.com",
  "password": "StrongPass123!",
  "wantsToBeMentor": false
}
```

Response `201`:

```json
{
  "user": {
    "id": 1,
    "email": "dana@example.com",
    "fullName": "Dana Levi",
    "isAdmin": false,
    "mentorProfile": null,
    "createdAt": "2026-09-03T12:00:00.000Z"
  },
  "token": "jwt-token"
}
```

Validation response `400`:

```json
{
  "errors": ["Password must be at least 8 characters"]
}
```

Duplicate email response `409`:

```json
{
  "error": "Email already exists"
}
```

### `POST /api/auth/login`

Request:

```json
{
  "email": "mentee@queenb.org",
  "password": "Password123!"
}
```

Response `200`:

```json
{
  "user": {
    "id": 1,
    "email": "mentee@queenb.org",
    "fullName": "Example Mentee",
    "isAdmin": false,
    "mentorProfile": null,
    "createdAt": "2026-09-03T12:00:00.000Z"
  },
  "token": "jwt-token"
}
```

Invalid credentials response `401`:

```json
{
  "error": "Invalid email or password"
}
```

### `GET /api/auth/me`

Requires:

```text
Authorization: Bearer jwt-token
```

Response `200`:

```json
{
  "user": {
    "id": 1,
    "email": "mentee@queenb.org",
    "fullName": "Example Mentee",
    "isAdmin": false,
    "mentorProfile": null,
    "createdAt": "2026-09-03T12:00:00.000Z"
  }
}
```

Missing, invalid, or expired token response `401`.

## Mentor Search

### `GET /api/mentors`

Returns public mentor cards for active mentor profiles only. Admin APIs can see active and inactive mentor profiles.

## Admin API

All admin endpoints require:

```text
Authorization: Bearer jwt-token
```

Non-admin users receive `403`.

### `GET /api/admin/summary`

Returns operational counts:

```json
{
  "usersCount": 5,
  "mentorsCount": 2,
  "activeMentorsCount": 1,
  "scheduledMeetingsCount": 1,
  "completedMeetingsCount": 2,
  "pendingRequestsCount": 2,
  "unresolvedAlertsCount": 3
}
```

### `GET /api/admin/analytics`

Returns dashboard analytics for the last 3, 6, or 12 months. The default is 6 months. It includes monthly user/request/meeting activity, meeting status breakdown, completed-meeting feedback completion, and completed meetings by active mentor. Feedback answers are never returned.

Query parameter:

```text
months=3|6|12
```

### `GET /api/admin/users`

Query parameters:

```text
search
capability=admin|mentor|mentee
```

Returns safe user summaries with `capabilities` and `permissions` metadata for disabled admin controls.

### `GET /api/admin/users/:id`

Returns safe profile fields, capability badges, counts, recent requests, and recent meetings. Full meeting history should be read through `/api/admin/meetings`.

### `PATCH /api/admin/users/:id/admin`

Request:

```json
{
  "isAdmin": true
}
```

Blocks removing admin access from yourself and removing the last admin.

### `PATCH /api/admin/users/:id/profile`

Updates safe user profile fields only.

Request:

```json
{
  "fullName": "Dana Levi",
  "jobTitle": "Frontend Developer",
  "workplace": "QueenB",
  "yearsOfExperience": 2,
  "githubUrl": "https://github.com/example",
  "linkedinUrl": "https://linkedin.com/in/example",
  "technologies": ["React", "Node.js"]
}
```

Email, password fields, and `passwordHash` are ignored and must not be writable through this endpoint.

### `PATCH /api/admin/mentors/:mentorProfileId/visibility`

Request:

```json
{
  "isActive": false
}
```

Inactive mentor profiles are hidden from public mentor search.

### `PATCH /api/admin/mentors/:mentorProfileId/profile`

Updates an existing mentor profile. This endpoint does not create or remove mentor profiles.

Request:

```json
{
  "background": "Frontend and career mentoring",
  "meetingCapacity": 4,
  "meetingDurationMinutes": 45,
  "isActive": true,
  "mentoringTopics": ["CV Review", "React"]
}
```

### `GET /api/admin/meetings`

Query parameters:

```text
status=SCHEDULED|ATTENDANCE_CONFIRMED|COMPLETED|NOT_COMPLETED|RESCHEDULED|CANCELLED
mentorId
menteeId
startDate
endDate
missingFeedback=true
noShow=true
```

Response items include meeting status, request status, mentor/mentee safe identity fields, topics, attendance confirmations, outcome confirmations, and feedback status only. Feedback answers are not returned.

### `GET /api/admin/meetings/:id`

Returns a single meeting detail using the same safe shape as list items.

### `PATCH /api/admin/meetings/:id/status`

Request:

```json
{
  "status": "COMPLETED"
}
```

Supported admin MVP status changes:

```text
COMPLETED
NOT_COMPLETED
CANCELLED
```

Marking a meeting completed/not completed also updates the parent request status. Cancelling an active meeting cancels the parent request only when no active sibling meeting remains.

### `PATCH /api/admin/meetings/:id/schedule`

Updates the scheduled start and end time for a future active meeting only.

Request:

```json
{
  "scheduledStart": "2026-09-10T14:00:00.000Z",
  "scheduledEnd": "2026-09-10T14:45:00.000Z"
}
```

Allowed only when the meeting status is `SCHEDULED` or `ATTENDANCE_CONFIRMED` and the current meeting end time is still in the future. `scheduledEnd` must be after `scheduledStart`. If the meeting points to a selected offered slot, that slot is updated to match.

### `PATCH /api/admin/requests/:id/cancel`

Cancels an active request and any scheduled/attendance-confirmed meetings under it. Historical completed or not-completed meetings remain unchanged.

### `GET /api/admin/alerts`

Query parameters:

```text
type=NO_SHOW|MISSING_FEEDBACK|STALE_REQUEST|PAST_PENDING_MEETING|MENTOR_LOAD
resolved=resolved|unresolved
```

Alerts are derived from current records. Admin resolution rows are stored in `AdminAlertResolution` by alert key and remain valid until the source record changes materially.

### `PATCH /api/admin/alerts/:alertKey/resolve`

Marks a derived alert as handled.

### `PATCH /api/admin/alerts/:alertKey/unresolve`

Reopens a handled alert by removing its resolution row.

## Current Status Contracts

`MentoringRequest.status` values:

```text
WAITING_FOR_MENTOR_SLOTS
WAITING_FOR_MENTEE_SELECTION
REJECTED
MATCHED
ATTENDANCE_CONFIRMED
COMPLETED
NOT_COMPLETED
FEEDBACK_COMPLETED
CANCELLED
```

`Meeting.status` values:

```text
SCHEDULED
ATTENDANCE_CONFIRMED
COMPLETED
NOT_COMPLETED
RESCHEDULED
CANCELLED
```

## Future Admin Improvements

Planned but intentionally outside the Admin MVP:

- User/profile deactivation.
- Creating or removing mentor profiles.
- Editing emails, passwords, notes, or feedback.
- Admin audit log.
- Week/day/list calendar views.
- Export and richer analytics.
