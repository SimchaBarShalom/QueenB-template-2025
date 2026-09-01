# Queens Match — Phase 1 MVP

## Goal

Build the smallest reliable version of Queens Match that supports the complete core flow:

**Register/Login → Browse mentors → Request mentoring → Mentor proposes times → Mentee chooses a time → Meeting is scheduled**

Phase 1 is successful when this flow works end-to-end for real users.

## In Scope

### Authentication
- Register with `email`, `password`, `username`
- Login and logout
- Keep the user authenticated
- Protect authenticated and admin routes
- Never store plaintext passwords

### Mentor profile
- Any regular user can create a mentor profile
- Mentor can edit it later
- Fields:
  - professional background
  - mentoring topics
  - short description
  - preferred meeting duration
  - optional: company, technologies, years of experience

### Mentor discovery
- List mentors
- Open mentor details
- Request mentoring

### Mentoring request
- Mentee creates a request for a mentor
- Mentor can:
  - reject it, or
  - propose several date/time options
- Mentee can choose one proposed time
- The request then becomes scheduled

### My Mentoring
Show the logged-in user's relevant requests under:
- Action required
- Waiting
- Scheduled
- Rejected

### Admin
- Users list
- Mentoring requests list
- Show mentor, mentee, status, and scheduled time

## Required Statuses

- `PENDING_MENTOR`
- `PENDING_MENTEE`
- `SCHEDULED`
- `REJECTED`

The backend is the source of truth for status changes.

## Out of Scope

Do **not** build in Phase 1:
- WhatsApp integration
- notifications, cron jobs, queues, or reminders
- feedback
- attendance confirmation
- rescheduling rules
- mentor quotas/capacity rules
- advanced admin dashboard/calendar
- chatbot or AI features
- microservices, Redis, Kafka, Kubernetes
- calendar synchronization

Do not create placeholder services/tables for these future features.

## Definition of Done

The MVP is done when:
1. A new user can register and login.
2. A user can create a mentor profile.
3. Another user can find that mentor.
4. The mentee can send a mentoring request.
5. The mentor can reject it or propose times.
6. The mentee can choose a proposed time.
7. Both users see the correct final status and scheduled time.
8. Admin can view users and requests.
9. Authorization prevents users from modifying requests that do not belong to them.
10. Core flow tests pass.

## Build Order

1. Project setup
2. Database + `User`
3. Authentication
4. Mentor profile
5. Mentor discovery
6. Create mentoring request
7. Mentor request actions
8. Propose times
9. Select time
10. My Mentoring
11. Admin pages
12. Tests, cleanup, documentation

**Rule:** keep the application runnable after every step.
