# Queen Match

Queen Match is a full-stack mentoring platform for connecting women who want guidance with experienced women who can mentor them. It solves a practical community problem: matching is only the first step, so the platform also gives both sides a clear way to request a mentor, exchange proposed times, schedule a meeting, confirm what happened, and complete feedback.

## About QueenB

QueenB is a community and educational initiative that supports women entering and growing in technology. Queen Match extends that community model into a structured mentoring experience: mentors share focused professional experience, while mentees can discover relevant support without managing the process through scattered messages and spreadsheets.

## What this solution adds

- A searchable mentor directory with topics, workplace, experience and current monthly capacity.
- A tracked request and meeting lifecycle instead of an informal one-off introduction.
- Separate mentor, mentee and admin workspaces with role-aware actions.
- In-app notifications, email hooks, feedback collection and operational visibility for administrators.
- A responsive, multilingual interface designed for Hebrew-first RTL use, with English and Arabic translations.

## Capabilities

| Role | Main capabilities |
| --- | --- |
| Mentee | Create a profile, search and filter active mentors, send requests, choose from offered slots, manage upcoming/past meetings, confirm outcomes and submit feedback. |
| Mentor | Create a mentor profile, define topics, duration and monthly capacity, review requests, offer slots, schedule/reschedule or cancel meetings, confirm outcomes and submit feedback. |
| Admin | View KPIs and analytics, manage users and mentor visibility, inspect meetings, update eligible meeting statuses, use bulk operations, review alerts and open meeting details. |

## Main user journey

1. A mentee registers or signs in, completes her profile and searches active mentor cards using job title, workplace and topic filters.
2. She sends a request. The mentor can accept the workflow and offer one or more available time slots; the mentee selects a slot.
3. The request becomes a scheduled meeting. Capacity is checked against the mentor’s current calendar month, with server-side rules for active meetings and rescheduling.
4. Both participants can see the meeting in their dashboard and meeting area. In-app notifications and configured SMTP email messages communicate requests, slot availability, matches, reminders and follow-up actions.
5. After the scheduled time, both sides confirm whether the meeting occurred. Completed meetings can receive feedback from each participant; no-shows and cancellations follow separate lifecycle states.

Google sign-in is shown in the interface as a future integration, and Google Calendar/Meet event creation is not implemented in this MVP. The current journey ends with the platform’s scheduled meeting record and notification workflow; a future OAuth integration can add calendar invites and Meet links without changing the core request model.

## Technology stack

| Technology | Use in Queen Match |
| --- | --- |
| React 18 | Component-based client application, dashboards, forms and responsive views. |
| React Router | Public, authenticated mentor/mentee and admin navigation. |
| Material UI | Accessible controls, cards, tables, dialogs, pagination and responsive layout. |
| Node.js + Express | REST API, route composition, validation and centralized error handling. |
| Prisma 6 + PostgreSQL | Typed data access, migrations, relations and lifecycle persistence. |
| JWT + bcryptjs | Bearer-token sessions and one-way password hashing. |
| Axios | Client-to-API requests through the development proxy. |
| Nodemailer | Configurable Gmail SMTP delivery for request, meeting and contact emails. |
| FullCalendar | Admin month calendar view for meetings. |

## Architecture

```mermaid
flowchart LR
  UI[React client<br/>MUI + RTL] --> API[Express REST API]
  API --> AUTH[Auth middleware]
  API --> S[Domain services<br/>users · mentors · requests · meetings · admin]
  S --> P[Prisma ORM]
  P --> DB[(PostgreSQL)]
  S --> N[Notifications + email service]
  N --> SMTP[SMTP / Gmail]
  S -. planned OAuth/calendar integration .-> G[Google OAuth<br/>Calendar / Meet]
```

## Technical highlights

- Role-based permissions are enforced in the API; a mentor profile identifies mentor capability, while `isAdmin` controls admin access.
- Requests and meetings model pending slots, mentee selection, scheduled, attendance-confirmed, completed, no-show, rejected, cancelled and feedback-complete states.
- Mentor capacity is calculated from active meetings in the current calendar month, and cancelled/rescheduled meetings release capacity.
- Large lists use server-side, filter-aware page pagination with bounded page sizes, including mentor search, requests, notifications and admin users/meetings.
- Admin summary and analytics queries remain separate from paginated management lists so dashboard totals are not reduced to the current page.
- Notifications support in-app history and pagination; email delivery is configurable through SMTP environment variables.
- Hebrew is the default language. Hebrew and Arabic set RTL document direction; English sets LTR. Layouts include desktop and mobile navigation patterns.

## Local setup

### Prerequisites

Install Node.js and npm, and have a PostgreSQL database available locally.

```bash
git clone <repository-url>
cd QueenB-template-2025
npm install
npm run install-all
```

Create `server/.env` from `server/.env.example` and set:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/queens_match?schema=public"
JWT_SECRET="use-a-long-local-development-secret"
```

For email delivery, also configure `SMTP_USER` and `SMTP_PASSWORD`. Keep `.env` out of version control and never use development credentials in production.

Initialize the database from the server directory:

```bash
cd server
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
cd ..
```

The additive, upsert-only seed creates baseline and expanded Hebrew demo users, mentors, mentees, requests, meetings, feedback and notifications across multiple dates and lifecycle states. Running it again preserves existing records and does not reset or delete the database. Development-only test accounts and their shared seed password are defined in `server/prisma/seed.js`; do not reuse them outside a local demo.

Run the app in two terminals or together:

```bash
npm run server   # API: http://localhost:5000
npm run client   # UI: http://localhost:3000
# or: npm run dev
```

Useful checks include `GET http://localhost:5000/api/health`, `npm run build`, and `cd server && npm test`.

## Tests, MVP limits and next steps

The server has Jest coverage for authentication, mentor profiles, requests, meetings and admin services. The client uses the Create React App test setup. Before presenting a local demo, run the seed and then `cd server && npm test`; use `npm run build` to verify the client production build.

Current MVP limits include no implemented Google OAuth, Google Calendar event creation or Google Meet link generation; email requires SMTP configuration; and the feedback questionnaire is stored as flexible JSON while the final product questionnaire is still evolving.

Future improvements include completing Google integration, adding richer matching recommendations, expanding automated client/API coverage, adding scheduled background delivery for reminders, and introducing production observability and deployment configuration.

Queen Match was built in one week by a three-person team.
