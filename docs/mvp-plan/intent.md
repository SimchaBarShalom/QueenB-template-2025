# Queens Match - Intent

## Project Purpose
Queens Match is a QueenB community web application that connects mentors and mentees so they can schedule mentoring meetings in an organized way.

The project exists because the community needs a dedicated tool for matching mentees with mentors, tracking requests, and helping the community admin understand what is happening.

## Main Goals
- Build a working full-stack MVP in one week.
- Practice real team collaboration with Git, pull requests, reviews, and integration.
- Practice a complete client-server-database flow.
- Keep the project maintainable so future QueenB teams can continue it.

## Users
| User type | Meaning | Main actions |
| --- | --- | --- |
| Mentee | A regular user looking for help | Browse mentors, request mentoring, choose a proposed time, request more times once, request one reschedule |
| Mentor | A regular user who created a mentor profile | Edit mentor profile, receive requests, reject requests, propose time options, handle reschedule |
| Admin | Community manager | View users, view mentoring requests/meetings, understand current statuses |

One account can be both a mentee and a mentor. Admin is an extra permission on a regular user account.

## MVP Scope
The MVP must support the core flow:

Register/Login -> Browse mentors -> Request mentoring -> Mentor proposes times or rejects -> Mentee chooses a time -> Meeting is scheduled

The MVP also includes:
- Mentor profile create/edit.
- My Mentoring page for requests relevant to the logged-in user.
- One request for additional times if the first proposed times do not work.
- One reschedule after a meeting was scheduled.
- Basic read-only admin pages.

## Out Of Scope For MVP
These are important, but they should not be built in the one-week MVP:

- WhatsApp integration.
- Automatic reminders.
- Attendance confirmation.
- Feedback forms.
- Automatic thank-you messages.
- Advanced admin calendar.
- Admin alert system.
- Deployment.
- Chatbot.
- AI-generated images.
- Advanced search and analytics.

## Product Principles
- Correct workflow is more important than visual polish.
- Keep screens simple, readable, and mobile-friendly.
- Use Hebrew user-facing text and RTL layout.
- Keep backend rules as the source of truth for permissions and statuses.
- Avoid placeholder systems for future features.

## Collaboration Principles
- Three students should each work on a vertical feature area.
- Every student should run the full project locally on her own computer.
- Nobody should commit directly to `main`.
- Work should happen on branches and merge through pull requests.
- Code review should be done by at least one teammate before merge.
- Small, frequent pull requests are better than one large final merge.
