# Queens Match MVP Spec

## Functional Requirements

Queens Match must support regular users and admins.

Regular users can:

- Register and log in.
- Register as a mentee or mentor.
- Browse available mentors.
- Request mentoring from a mentor.
- Track request and meeting status.
- Choose one offered time slot.
- Ask once for more times if no offered time works.
- Reschedule once after a meeting is matched.
- Confirm whether the meeting happened.
- Submit simple feedback.

Mentors can:

- Create and edit mentor profile details.
- Define mentoring topics, background, capacity, meeting duration, and online meeting link.
- View incoming mentoring requests.
- Offer future meeting slots.
- Reject requests.
- Track scheduled meetings.

Admins can:

- View users.
- View user details.
- View meetings and statuses.
- Filter meetings by status and participants.
- View a calendar-style meeting list.
- View meeting details.
- View alerts for problematic or follow-up-required meetings.

## User Roles

- Mentee: can request mentoring but cannot mentor unless upgraded later.
- Mentor: can receive mentoring requests. Mentors cannot request mentoring in the MVP.
- Admin: can view all users, meetings, details, filters, and alerts.

## Auth Requirements

- Stack: React + Express + PostgreSQL + Prisma.
- Auth: JWT login/register with bcrypt password hashing.
- Password rule: minimum 8 characters, with letters and numbers.
- Admin user seeded by `ADMIN_EMAIL`.
- Role stored on the user record.
- Protected API routes require a valid JWT.
- Admin routes require admin role.

## Mentor Flow

1. Mentor registers through the mentor registration page.
2. Mentor fills required profile fields:
   - Name
   - Email
   - Password
   - Development languages or stack
   - Job/workplace
   - Years of experience
   - Background
   - Mentoring topics
   - Number of mentoring meetings willing to do
   - Meeting duration
   - Online meeting link
   - Optional photo, GitHub, LinkedIn
3. Mentor receives requests.
4. Mentor either rejects a request or offers future slots.
5. Mentor is notified when a mentee chooses a slot.
6. Mentor can request one reschedule after the meeting is matched.

## Mentee Flow

1. Mentee registers through the mentee registration page.
2. Mentee required fields:
   - Name
   - Email
   - Password
3. Optional mentee fields:
   - Development languages or stack
   - Job/workplace
   - Years of experience
   - Photo
   - GitHub
   - LinkedIn
4. Mentee browses mentors.
5. Mentee sends a request to one mentor.
6. Mentee cannot create duplicate active requests to the same mentor.
7. Mentee chooses one offered slot or asks once for more slots.
8. Mentee can reject/end the request if no time works.
9. Mentee can later upgrade to mentor profile.

## Scheduling And Rescheduling Rules

- Offered slots must be in the future.
- Online meeting link is required.
- A mentee can ask once for more offered times.
- If the second set of offered times does not work, the mentee must reject/end the request.
- After a meeting is matched, either side can request rescheduling once.
- Only one reschedule iteration is allowed.
- Mentor capacity is enforced using active plus completed meetings.
- Duplicate active mentee-to-mentor requests are blocked.

## Meeting Statuses

Recommended statuses:

- `REQUESTED`
- `REJECTED_BY_MENTOR`
- `SLOTS_OFFERED`
- `MORE_SLOTS_REQUESTED`
- `MATCHED`
- `RESCHEDULE_REQUESTED`
- `RESCHEDULED`
- `CANCELLED`
- `COMPLETED`
- `NO_SHOW`
- `FEEDBACK_PENDING`
- `FEEDBACK_COMPLETE`

## Admin Requirements

Admin dashboard must include:

- Users list with name, email, role, mentor count, mentee count.
- User detail page with registration details and meeting counts.
- Meetings list with filters by status, mentor, and mentee.
- Calendar-style view with meetings colored by status.
- Meeting detail page with participants, time, status, attendance, and feedback.
- Alerts for:
  - No-show meetings.
  - Past confirmed meetings that still need attendance confirmation.
  - Feedback missing for more than one week.
  - Mentor with more than 10 meetings for appreciation.

## Data Model

Core entities:

- `User`: id, name, email, passwordHash, role, stack, workplace, yearsExperience, photoUrl, githubUrl, linkedinUrl, createdAt, updatedAt.
- `MentorProfile`: id, userId, background, topics, meetingCapacity, meetingDurationMinutes, meetingLink, isActive, createdAt, updatedAt.
- `MentoringRequest`: id, mentorId, menteeId, status, message, extraSlotsRequested, rescheduleUsed, createdAt, updatedAt.
- `OfferedSlot`: id, requestId, startsAt, endsAt, selected, createdAt.
- `Meeting`: id, requestId, mentorId, menteeId, startsAt, endsAt, meetingLink, status, createdAt, updatedAt.
- `AttendanceConfirmation`: id, meetingId, userId, happened, createdAt.
- `Feedback`: id, meetingId, userId, rating, text, createdAt.

## API Outline

Auth:

- `POST /api/auth/register/mentee`
- `POST /api/auth/register/mentor`
- `POST /api/auth/login`
- `GET /api/auth/me`

Mentors:

- `GET /api/mentors`
- `GET /api/mentors/:id`
- `PUT /api/mentor-profile/me`

Requests and meetings:

- `POST /api/requests`
- `GET /api/requests/me`
- `POST /api/requests/:id/reject`
- `POST /api/requests/:id/slots`
- `POST /api/requests/:id/request-more-slots`
- `POST /api/requests/:id/select-slot`
- `POST /api/meetings/:id/reschedule`
- `POST /api/meetings/:id/attendance`
- `POST /api/meetings/:id/feedback`

Admin:

- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `GET /api/admin/meetings`
- `GET /api/admin/meetings/:id`
- `GET /api/admin/alerts`

## Pages And Routes

Public:

- `/login`
- `/register/mentee`
- `/register/mentor`

Regular user:

- `/mentors`
- `/mentors/:id`
- `/requests`
- `/meetings`
- `/profile`

Admin:

- `/admin`
- `/admin/users`
- `/admin/users/:id`
- `/admin/meetings`
- `/admin/meetings/:id`
- `/admin/calendar`
- `/admin/alerts`

## Edge Cases

- Duplicate active request to same mentor is blocked.
- Mentor cannot offer past slots.
- Mentee cannot select a slot that was not offered.
- Mentee cannot request more slots more than once.
- Meeting cannot be rescheduled more than once.
- Mentor cannot exceed capacity.
- Non-admin cannot access admin APIs.
- User cannot update another user's private data.
- Feedback can only be submitted by meeting participants.
- Attendance can only be confirmed by meeting participants.

## PDF Requirement Validation Checklist

- User accounts and authentication: included.
- Mentor list and mentor details: included.
- Become mentor and edit mentor profile: included.
- Request mentoring: included.
- Mentor offers times or rejects: included.
- Mentee chooses time: included.
- One extra-times request: included.
- One reschedule iteration: included.
- Admin meeting report with filters: included.
- Admin calendar by status: included.
- Admin meeting detail page: included.
- Admin users list and user details: included.
- Admin alerts: included.
- Attendance confirmation: included manually.
- Feedback: included simply.
- WhatsApp reminders: future implementation.
- Advanced reminders and automation: future implementation.
