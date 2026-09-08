# Queen Match

QueenB is a community and educational initiative that supports women entering and growing in technology.

Queen Match is a mentoring platform for women in technology. It helps mentees find suitable mentors and manage the mentoring journey in one place.

The platform connects mentees with relevant mentors, from the first request through scheduling, meetings and feedback.

## ✨ What the MVP does

- Register and log in as a mentee or mentor.
- Search active mentors by topic, job title or workplace.
- Send mentoring requests and exchange proposed time slots.
- Schedule, cancel or reschedule meetings, then submit feedback.
- Connect mentor calendars through Google OAuth and create Google Calendar events with Google Meet links.
- Use in-app notifications, Gmail SMTP email and an admin workspace for users, meetings, analytics and alerts.
- Work in Hebrew-first RTL, English or Arabic layouts across desktop and mobile.

## 👥 Roles and capabilities

| Role | Main capabilities |
| --- | --- |
| Mentee | Edit a profile, search mentors, send requests, choose proposed slots, manage meetings, confirm outcomes and submit feedback. |
| Mentor | Create or edit a mentor profile, define topics, capacity and duration, review requests, offer slots, reschedule or cancel meetings, confirm outcomes and submit feedback. |
| Admin | View KPIs and analytics, manage users and mentor visibility, inspect and update meetings, use bulk actions, review alerts and open details. |

## 🧭 Website flow

```mermaid
flowchart TB
  HOME[Public homepage] --> LOGIN[Login]
  HOME --> REGISTER[Register]
  HOME --> ABOUT[About / FAQ / Contact]

  LOGIN --> ROUTE[Redirect by capability]
  REGISTER --> ROUTE
  ROUTE --> MEE[Mentee area<br/>/mentee · /mentee/mentors · /mentee/meetings]
  ROUTE --> MEN[Mentor area<br/>/mentor · /mentor/meetings]
  ROUTE --> ADM[Admin area<br/>/admin · users · meetings · calendar · alerts]

  SHARED[Shared authenticated area<br/>/profile · notifications · language switcher]
  MEE --> SHARED
  MEN --> SHARED
  ADM --> SHARED
  MEE -. role switch .-> MEN
  MEN -. role switch .-> MEE

  MEE -. restricted by MenteeOnlyRoute .-> ADM
  MEN -. restricted by MentorOnlyRoute .-> ADM
  ADM -. requires isAdmin .-> ADMIN_GUARD[Admin guard]
```

Login and Register are separate user journeys. In the current frontend they open as dialogs from the public homepage rather than separate React routes. Authenticated pages are protected by role-aware route guards.

## 🔄 Core mentoring workflow

```mermaid
flowchart LR
  A[Mentee searches mentors] --> B[Sends mentoring request]
  B --> C[Mentor accepts workflow]
  C --> D[Mentor proposes time slots]
  D --> E[Mentee selects a slot]
  E --> F[Meeting is created]
  F --> G[In-app notification + Gmail email]
  F --> X[Google Calendar event + Google Meet link]
  G --> H[Meeting outcome]
  H --> I[Feedback]
  F --> J[Cancel or request one reschedule]
```

The request, scheduling rounds, offered slots and meeting attempts are stored separately. This preserves rescheduling history instead of replacing the original record.

## 🏗️ Architecture

```mermaid
flowchart LR
  UI[React client<br/>MUI + RTL] --> API[Express REST API]
  API --> AUTH[JWT / admin middleware]
  API --> S[Domain services<br/>users · mentors · requests · meetings · admin]
  S --> P[Prisma ORM]
  P --> DB[(PostgreSQL)]
  S --> N[Notifications + email service]
  N --> SMTP[Nodemailer / Gmail SMTP]
  S --> O[Google OAuth]
  O --> G[Google Calendar API<br/>Calendar event + Meet link]
```

## 🛠️ Technology stack

| Technology | Use in Queen Match |
| --- | --- |
| React 18 | Client application, dashboards, forms and reusable components. |
| React Router | Public, mentee, mentor and admin navigation. |
| Material UI + Emotion | Accessible controls, cards, dialogs, tables, responsive layout and theme styling. |
| React i18n layer | Hebrew, English and Arabic translations with RTL support. |
| Axios | Browser-to-API requests and Bearer token headers. |
| FullCalendar | Admin monthly calendar view. |
| Node.js + Express | Server runtime, REST routes, middleware and error handling. |
| Prisma 6.19.3 | PostgreSQL ORM, relations, constraints and migrations. |
| PostgreSQL | Persistent relational data store. |
| bcryptjs | One-way password hashing. |
| jsonwebtoken | Signed JWT sessions with a seven-day expiration. |
| googleapis | Google Calendar OAuth, event creation and Google Meet conference links. |
| Nodemailer | Email delivery through configured Gmail SMTP credentials. |
| Jest | Server-side unit tests for authentication, mentoring and admin services. |

## 🔌 API groups

| API group | Responsibility |
| --- | --- |
| `/api/auth` | Register, login and restore the current session. |
| `/api/users` | Create and update user and mentor profiles. |
| `/api/mentors` | List active mentors with filters and pagination. |
| `/api/mentoring-requests` | Create requests, respond to requests, offer slots and select or cancel slots. |
| `/api/meetings` | Schedule, cancel, reschedule, confirm outcomes and submit feedback. |
| `/api/google-calendar` | Check connection, start OAuth, handle the callback, create events and list upcoming events. |
| `/api/notifications` | Return the authenticated user’s in-app notifications. |
| `/api/admin` | Summary, analytics, users, meetings, calendar data and alerts. |
| `/api/contact` | Validate and send contact messages by email. |
| `/api/health` | Return server health information. |

## ⚠️ Limitations & Next Steps

### Current MVP limitations

- Email delivery requires valid `SMTP_USER` and `SMTP_PASSWORD` configuration.
- Google Calendar requires OAuth credentials, an encryption key and a mentor connection before a mentee can schedule a meeting.
- If Google event creation fails after the local meeting is created, the error is logged and the meeting may remain without external calendar or Meet links.
- `AttendanceConfirmation` exists in the Prisma schema, but the current meeting service records outcome confirmations instead of a full two-sided attendance workflow.
- The `FEEDBACK_COMPLETED` enum exists, but submitting feedback does not currently transition the meeting/request to that status.
- Analytics are basic backend summaries and monthly calculations; there are no advanced impact dashboards or CSV exports.
- There is no scheduled background job system for reminders.

### Future ideas

These are not implemented features in the current MVP:

- Integrated support chatbot.
- Mentee learning groups.
- Waiting lists for fully booked mentors.
- Automated meeting reminders and follow-ups.
- In-app mentor–mentee messaging.
- Expanded admin analytics and impact tracking.

## 🚀 Local setup

### Prerequisites

- Node.js and npm.
- A local PostgreSQL database.

### Install

```bash
git clone <repository-url>
cd QueenB-template-2025
npm install
npm run install-all
```

Create `server/.env` and set:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/queens_match?schema=public"
JWT_SECRET="use-a-long-local-development-secret"
GOOGLE_CALENDAR_REDIRECT_URI="http://localhost:5000/api/google-calendar/oauth2/callback"
GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY="replace-with-a-base64-encoded-32-byte-key"
```

For email delivery, also set `SMTP_USER` and `SMTP_PASSWORD`. Keep `.env` out of version control.

Google Calendar setup:

- Enable the Google Calendar API and configure the OAuth consent screen in Google Cloud.
- Add this redirect URI: `http://localhost:5000/api/google-calendar/oauth2/callback`.
- Copy the provided credentials file to `server/secrets/credentials.json`.
- Keep PostgreSQL running on `localhost:5432`.

Initialize the database:

```bash
cd server
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
cd ..
```

### Run

```bash
npm run server   # API: http://localhost:5000
npm run client   # UI: http://localhost:3000
# or run both:
npm run dev
```

Health check:

```text
GET http://localhost:5000/api/health
```

The seed script creates local demo users and mentoring data. Use the credentials defined in `server/prisma/seed.js` only for local development.

Mentors must connect Google Calendar from the mentor navbar before meetings can be scheduled with Google Meet links.

## 📁 Project structure

```text
QueenB-template-2025/
├── client/                 # React application
│   └── src/
│       ├── components/     # Shared, mentee, mentor and admin UI
│       ├── services/       # Client API helpers
│       └── i18n/           # Hebrew, English and Arabic translations
├── server/                 # Express application
│   ├── routes/             # REST route groups
│   ├── services/           # Business logic
│   ├── middleware/         # Authentication and authorization
│   └── prisma/             # Schema, migrations and seed
├── docs/                   # Contracts, plans, tests and presentation material
├── package.json            # Root development scripts
└── README.md
```

Queen Match was built in one week by a three-person team.
