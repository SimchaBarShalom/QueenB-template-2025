# Queens Match MVP Plan

## Implementation Plan

Build the MVP in practical student-project phases:

1. Set up database, auth, roles, and seed data.
2. Build mentor and mentee registration/login.
3. Build mentor browsing and mentor profile management.
4. Build request, slot offering, matching, rejection, more-slots, and reschedule flows.
5. Build meeting status tracking, attendance, and feedback.
6. Build scoped admin views, filters, calendar view, meeting details, users, and alerts.
7. Validate against the assignment PDF and prepare demo.

## 3-Student Task Split

### Student 1: Auth, Users, Profiles, Database

Owns:

- Prisma schema and database setup.
- User model.
- Mentor profile model.
- Register/login APIs.
- JWT middleware.
- Role-based access middleware.
- Seed script with admin, mentors, mentees, meetings, statuses, and feedback.
- Profile pages and forms.

Concrete deliverables:

- Working login.
- Working mentor and mentee registration.
- Admin seeded from `ADMIN_EMAIL`.
- User profile and mentor profile editing.
- Auth-protected routes.

### Student 2: Mentor/Mentee Matching Flow

Owns:

- Mentor list and mentor detail pages.
- Mentoring request creation.
- Duplicate active request blocking.
- Mentor request inbox.
- Reject request action.
- Offer future slots action.
- Mentee slot selection.
- One-time more-slots request.
- One-time reschedule flow.
- User-facing meeting status pages.

Concrete deliverables:

- Mentee can browse mentors and request mentoring.
- Mentor can offer slots or reject.
- Mentee can choose slot.
- More-slots and reschedule rules enforced.
- Meeting status visible to both sides.

### Student 3: Admin, Alerts, QA, Demo

Owns:

- Admin dashboard.
- Users list and user detail.
- Meetings list with filters.
- Calendar-style meeting view.
- Meeting detail page.
- Alerts logic.
- Attendance confirmation UI.
- Feedback UI.
- Testing checklist and demo script.

Concrete deliverables:

- Admin can inspect users and meetings.
- Admin can filter by status and participants.
- Admin can see alerts required by the PDF.
- Demo data supports every required flow.
- Main acceptance tests pass.

## Collaboration Workflow

- Each student works on a dedicated feature branch.
- Every student owns both frontend and backend for their feature area.
- Use pull requests for merging into the shared branch.
- Review another student's pull request before merging.
- Avoid editing unrelated files.
- Avoid `git add .`; stage specific files only.
- Pull latest changes before starting daily work.
- Resolve conflicts together when they touch shared files like routes, app layout, or Prisma schema.

## Branching Strategy

Main planning branch:

- `docs/mvp-plan`

Suggested feature branches:

- `feature/auth-users-profiles`
- `feature/matching-flow`
- `feature/admin-alerts`

Merge flow:

1. Create feature branch from the latest shared branch.
2. Commit small, focused changes.
3. Open pull request.
4. One teammate reviews.
5. Merge after review and basic test pass.

## Sub-Agent Orchestration Plan

Use sub-agents for review and focused planning only.

Recommended uses:

- Auth/API reviewer: checks route protection, JWT handling, and role access.
- Data model reviewer: checks Prisma relationships and status rules.
- Frontend reviewer: checks RTL layout, page flow, and missing states.
- PDF compliance reviewer: checks the final app against the assignment checklist.

Do not use sub-agents to make unreviewed implementation changes directly.

## Milestones

### Milestone 1: Foundation

- Database schema exists.
- Seed data works.
- Auth works.
- Mentor and mentee registration works.
- Admin user exists.

### Milestone 2: Core Matching

- Mentor browsing works.
- Mentee request flow works.
- Mentor can reject or offer slots.
- Mentee can choose slot.
- Status tracking works.

### Milestone 3: Rules And Follow-Up

- Duplicate active requests blocked.
- Future slot validation works.
- One more-slots request enforced.
- One reschedule enforced.
- Attendance confirmation works.
- Feedback works.

### Milestone 4: Admin And Demo

- Admin users view works.
- Admin meetings view works.
- Admin filters work.
- Admin calendar view works.
- Admin alerts work.
- Demo checklist passes.

## Testing And Validation Plan

Automated tests should cover:

- Register and login.
- Password validation.
- JWT-protected routes.
- Admin-only route access.
- Mentor profile required fields.
- Duplicate active request blocking.
- Future-only slot validation.
- One more-slots request limit.
- One reschedule limit.
- Mentor capacity enforcement.
- Feedback and attendance participant-only rules.
- Admin filters and alerts.

Manual validation should cover:

- Mentee full request-to-meeting flow.
- Mentor rejection flow.
- No offered time works flow.
- Reschedule flow.
- Admin meeting review flow.
- Hebrew RTL layout scan.

## Demo Checklist

Before demo:

- Start client and server locally.
- Confirm seed data exists.
- Log in as admin.
- Log in as mentor.
- Log in as mentee.
- Show mentee browsing mentors.
- Show request creation.
- Show mentor offering slots.
- Show mentee choosing slot.
- Show meeting status update.
- Show attendance and feedback.
- Show admin users.
- Show admin meetings with filters.
- Show admin calendar.
- Show admin alerts.
- Explain future WhatsApp and advanced dashboard features.
