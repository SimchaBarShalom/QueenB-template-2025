# Queens Match MVP Intent

## Product Purpose

Queens Match is a QueenB bootcamp web app that connects mentees with mentors from the QueenB community. The app helps mentees find relevant mentors, request mentoring, schedule meetings, track meeting status, and complete post-meeting follow-up.

Admins can monitor users, meetings, statuses, and alerts so the community manager can keep the mentoring process healthy.

## Target Users

- Mentees: QueenB participants who want mentoring.
- Mentors: QueenB community members who volunteer to mentor.
- Admins: QueenB community managers who monitor users, meetings, issues, and follow-up.

## Main User Value

- Mentees can find relevant mentors and schedule mentoring without manual coordination.
- Mentors can control their profile, capacity, offered topics, and meeting slots.
- Admins can see the full mentoring picture and identify meetings that need attention.

## MVP Boundaries

The MVP includes:

- Register and login with JWT authentication.
- Separate mentor and mentee registration flows.
- Mentor profiles with required background, topics, capacity, duration, and links.
- Mentee mentor browsing and request flow.
- Mentor slot offering or rejection.
- Mentee slot selection.
- One allowed extra-times request when no offered slot works.
- One allowed reschedule after a matched meeting.
- In-app meeting statuses and messages.
- Manual attendance confirmation.
- Simple feedback after meetings.
- Simple admin dashboard with users, meetings, filters, calendar view, details, and alerts.
- Local demo setup with seeded admin and sample data.

## Non-Goals

These are intentionally outside the MVP:

- WhatsApp automation.
- Email automation beyond future planning.
- Advanced analytics and graphs.
- Production deployment.
- Payment, subscriptions, or external calendar sync.
- Complex mentor matching algorithm.
- Multi-language UI beyond Hebrew RTL layout.
