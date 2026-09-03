# Queens Match — One-Week Phased Work Plan

## Plan goal

Build a small but working Queens Match MVP in one week with three junior developers, using the existing `QueenB-template-2025` repository.

The team will work in phases. Phase 1 creates a shared foundation. In every later phase, all three developers work in parallel on separate features and separate feature branches. A developer may own several branches during the week, but **every feature gets its own branch and pull request**.

## Core Git rule

Do not create one long-lived branch per developer. Use short-lived branches such as:

```text
feature/mentor-profile
feature/mentor-directory
feature/create-request
feature/offer-slots
feature/select-slot
feature/admin-users
feature/attendance
```

When a feature is complete:

1. Pull the latest `main`.
2. Synchronize the feature branch with `main`.
3. Run the relevant checks.
4. Open a small pull request.
5. Obtain one teammate review.
6. Merge into `main`.
7. Delete the merged branch.
8. Create the next feature branch from the updated `main`.

Use `main` plus short-lived feature branches. A separate `develop` branch is unnecessary for a three-person, one-week project.

## Team labels

The plan uses neutral labels:

- **Team Member 1**
- **Team Member 2**
- **Team Member 3**

Assign the real names before starting. Whoever is most comfortable with repository setup should be Team Member 1 for Phase 1. Ownership may rotate in later phases.

## One-week overview

| Phase | Suggested time | Main outcome |
|---|---:|---|
| Phase 0 — Agreement | 1–2 hours | Scope, contracts, roles, and Git rules agreed |
| Phase 1 — Shared foundation | Day 1 | Foundation implemented once and verified on all three computers |
| Phase 2 — Core user experience | Day 2 | Auth/profile, mentor browsing, and initial admin visibility |
| Phase 3 — Request and scheduling flow | Days 3–4 | A mentee request becomes a scheduled meeting |
| Phase 4 — Meeting completion | Day 5 | Rescheduling, attendance, feedback, and admin alerts |
| Phase 5 — Integration and stabilization | Day 6 | Complete end-to-end flow, consistent UI, fixed integration defects |
| Phase 6 — Final QA and documentation | Day 7 | Reproducible demo-ready MVP |

The timing is a target, not a reason to merge unfinished work. If the team falls behind, protect the primary happy path and simplify secondary behavior.

## Phase 0 — Agreement before coding

### Shared goal

Make the minimum decisions required to prevent three implementations of the same concept.

### Team Member 1 — Repository and branch conventions

**Tasks**

- Confirm the shared fork and collaborator access.
- Document branch names, PR rules, review expectations, and merge order.
- Record the Node.js and npm versions used by the team.

**Deliverable**

- `docs/git-workflow.md`

### Team Member 2 — API contract draft

**Tasks**

- Document endpoint paths, authentication header, IDs, dates, error format, and primary request/response shapes.
- Separate `MentoringRequestStatus` from `MeetingStatus`.

**Deliverable**

- Initial `docs/api-contracts.md`

### Team Member 3 — MVP acceptance scenarios

**Tasks**

- Write the happy path from registration to feedback.
- Write role-access checks and the main business-rule scenarios.
- Mark secondary scenarios that may be simplified if time becomes tight.

**Deliverable**

- `docs/mvp-test-scenarios.md`

### Phase 0 Definition of Done

- [ ] Everyone can access the same repository.
- [ ] Roles and status names are agreed.
- [ ] API uses string IDs and ISO 8601 UTC date strings.
- [ ] Feature branches and small PRs are required.
- [ ] The one-week MVP boundary is understood.

## Phase 1 — Shared foundation

### Shared goal

Create one stable base that all later feature branches use. One developer implements it; the other two do not build competing versions. They review, run, and verify it independently.

### Team Member 1 — Foundation implementer

**Branch**

```text
chore/shared-foundation
```

**Tasks**

1. Run the existing template before changing it.
2. Fix the client entry point so it renders `App`, not `Dashboard` directly.
3. Preserve useful existing pieces: root scripts, Create React App, MUI, Axios, React Router, Express, Helmet, CORS, Morgan, and `/api/health`.
4. Incrementally migrate retained client and server files to TypeScript.
5. Add modular client route files and placeholder pages.
6. Add global Hebrew RTL configuration.
7. Add a centralized Axios client using `REACT_APP_API_URL` or the existing local proxy.
8. Separate Express startup from app configuration.
9. Add modular API routing, environment validation, authentication middleware, role middleware, not-found handling, and centralized errors.
10. Initialize PostgreSQL and Prisma.
11. Add the agreed initial schema, enums, migration, Prisma client, and seed script.
12. Seed at least one admin, two mentors, two mentees, profiles, example requests, slots, and a meeting.
13. Implement minimal authentication: mentor registration, mentee registration, login, `/api/auth/me`, bcrypt, JWT, and role checking.
14. Add frontend authentication state, login/registration forms, protected routes, and admin-protected routes.
15. Update `.env.example` and README setup commands.

**Files most likely to change**

- Root/client/server `package.json`
- Lockfiles
- Client entry point, `App`, theme, global styles, and routers
- Server entry point, `app`, router index, and middleware
- `server/prisma/schema.prisma`, initial migration, and seed
- `.env.example` files
- Shared auth types/constants

**Definition of Done**

- The complete foundation smoke test passes on Team Member 1's computer.
- Type checks/builds succeed.
- No real secret is committed.
- A foundation PR is open and ready for review.

### Team Member 2 — Clean-install verifier and code reviewer

**Branch**

No implementation branch initially. Review `chore/shared-foundation`.

**Tasks**

- Review the folder structure for clarity and unnecessary abstraction.
- Clone or pull the foundation branch into a clean local state.
- Follow only the README instructions.
- Install dependencies, configure environment variables, migrate, seed, and start both apps.
- Test mentee registration, login, refresh, logout, `/api/auth/me`, and blocked admin access.
- Report reproducible defects as PR comments.
- If a small fix is agreed, create a dedicated fix branch from the foundation branch or let Team Member 1 amend the foundation branch; do not make unrelated edits.

**Definition of Done**

- Setup succeeds without undocumented knowledge.
- Authentication works locally.
- All issues found are fixed or explicitly accepted.
- Review approval is recorded.

### Team Member 3 — Second-platform verifier and contract reviewer

**Branch**

No implementation branch initially. Review `chore/shared-foundation`.

**Tasks**

- Independently run the same clean-install flow on her computer.
- Compare actual auth payloads and errors to `docs/api-contracts.md`.
- Verify Hebrew RTL, placeholder routes, seeded accounts, role guards, and admin access.
- Check that feature additions will not require editing one giant controller, router, or CSS file.
- Report reproducible issues as PR comments.

**Definition of Done**

- The project works on a third computer.
- API contracts match actual behavior.
- Folder extension points are understandable.
- Review approval is recorded.

### Foundation smoke test

1. Clone the repository.
2. Install dependencies through the documented root commands.
3. Copy the example environment files and enter development values.
4. Start PostgreSQL.
5. Run all Prisma migrations on an empty database.
6. Run the seed script.
7. Run the existing root development command and start both applications.
8. Call `GET /api/health` and expect HTTP 200.
9. Open the client and verify Hebrew RTL placeholders.
10. Register a mentee and a mentor using valid passwords.
11. Log in and receive a JWT.
12. Refresh a protected page and confirm the user is restored using `/api/auth/me`.
13. Verify no response exposes `passwordHash`.
14. Verify a regular user gets 403 from an admin-only endpoint.
15. Verify the seeded admin can access that endpoint and the admin placeholder.
16. Run client and server build/type-check commands.

### Phase 1 merge gate

Do not create feature branches until:

- [ ] Both reviewers successfully run the project on their computers.
- [ ] Foundation smoke test passes on all three computers.
- [ ] Both reviewers approve the PR.
- [ ] The foundation PR is merged into `main`.
- [ ] Every teammate pulls the same new `main` commit.

## Phase 2 — Core user experience

### Shared goal

Create the independent user-facing areas that the request workflow will depend on.

### Team Member 1 — Mentor profile management

**Branch**

```text
feature/mentor-profile
```

**Scope**

- `GET /api/mentor-profile/me`
- `PUT /api/mentor-profile/me`
- Mentor profile page and edit form
- Background, topics, stack, workplace, years of experience, capacity, duration, meeting link, photo URL, GitHub, and LinkedIn
- Authorization: mentor can edit only her own profile
- Server and client validation

**Conflict boundary**

Own only the mentor-profile feature folders. Any schema adjustment must be proposed and merged early as a separate `db/mentor-profile-fields` PR.

**Definition of Done**

- A seeded or registered mentor can view and edit her profile.
- A mentee cannot call profile-edit APIs.
- Invalid capacity/duration/URLs receive the standard error format.

### Team Member 2 — Mentor directory and details

**Branches, in order**

```text
feature/mentor-directory
feature/mentor-details
```

Finish and merge the directory before creating the details branch.

**Scope**

- `GET /api/mentors`
- `/mentors` page with simple filtering based on existing fields
- `GET /api/mentors/:id`
- `/mentors/:id` page
- Read-only mentor cards and details
- Typed mock data may be used until the endpoint is ready, but must match the contract

**Conflict boundary**

Do not edit mentor profile forms or authentication. Own the public/read-only mentor API and pages.

**Definition of Done**

- A mentee can browse active mentors and open a mentor detail page.
- Private fields and password hashes are never returned.
- Empty, loading, error, and mentor-not-found states work.

### Team Member 3 — Admin users

**Branches, in order**

```text
feature/admin-users-list
feature/admin-user-details
```

**Scope**

- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `/admin/users`
- `/admin/users/:id`
- Admin-only authorization and basic role filtering

**Conflict boundary**

Own only admin user feature folders. Do not build meetings, calendar, or alerts yet.

**Definition of Done**

- Admin can view users and safe user details.
- Mentor and mentee receive 403.
- Loading, empty, error, and not-found states work.

### Phase 2 integration gate

- [ ] Every feature has its own PR.
- [ ] PRs are merged one at a time after review.
- [ ] After every merge, remaining branches sync with `main`.
- [ ] Auth smoke tests still pass.
- [ ] Mentor profile, directory, details, and admin users work against the same database.

## Phase 3 — Request and scheduling flow

### Shared goal

Implement the main MVP journey: request mentoring, mentor responds with times, and mentee schedules a meeting.

### Team Member 1 — Create and track mentoring requests

**Branches, in order**

```text
feature/create-mentoring-request
feature/my-requests
```

**Scope**

- `POST /api/requests`
- Mentee request button/form on mentor details
- Prevent duplicate active requests to the same mentor
- `GET /api/requests/me`
- Role-specific request list for the logged-in user
- Request status display

**Conflict boundary**

Own creation/listing only. Do not implement mentor rejection or slot actions.

**Definition of Done**

- Mentee can create one active request per mentor.
- Mentor/admin cannot use the mentee create action.
- Both participants see only requests they are allowed to see.

### Team Member 2 — Mentor response and slot offering

**Branches, in order**

```text
feature/mentor-request-inbox
feature/reject-mentoring-request
feature/offer-meeting-slots
```

**Scope**

- Mentor request inbox using the agreed request-list contract
- `POST /api/requests/:id/reject`
- `POST /api/requests/:id/slots`
- Future-only slots, correct ownership, and valid status transitions
- Enforce mentor meeting capacity when accepting/scheduling work

**Conflict boundary**

Own mentor actions only. Do not implement mentee selection or additional-slot requests.

**Definition of Done**

- Mentor can see her incoming requests.
- Mentor can reject her own request only.
- Mentor can offer valid future slots.
- Invalid ownership, past slots, capacity overflow, and invalid transitions are rejected.

### Team Member 3 — Mentee slot decisions

**Branches, in order**

```text
feature/select-meeting-slot
feature/request-more-slots
feature/end-unsuitable-request
```

**Scope**

- `POST /api/requests/:id/select-slot`
- Display offered slots to the correct mentee
- Create/update a meeting when a real offered slot is selected
- `POST /api/requests/:id/request-more-slots`
- Allow additional slots only once
- Allow the mentee to end/cancel when the second group does not work

**Conflict boundary**

Own mentee decisions after slots are offered. Do not implement mentor slot creation.

**Definition of Done**

- Mentee can select only a slot offered for her request.
- Selecting a slot creates one scheduled meeting and marks the request matched.
- Additional slots can be requested once only.
- The request can be ended if no second-round slot works.

### Phase 3 integration order

Recommended merge order:

1. `feature/create-mentoring-request`
2. `feature/my-requests`
3. `feature/mentor-request-inbox`
4. `feature/reject-mentoring-request`
5. `feature/offer-meeting-slots`
6. `feature/select-meeting-slot`
7. `feature/request-more-slots`
8. `feature/end-unsuitable-request`

If a later feature needs a database or contract change, merge that small shared change first and then update all affected branches.

### Phase 3 Definition of Done

- [ ] Full happy path works from mentor detail to scheduled meeting.
- [ ] Rejection flow works.
- [ ] One additional-slot cycle works.
- [ ] Duplicate request, ownership, future-slot, selection, and capacity rules are enforced server-side.
- [ ] Each feature was reviewed and merged separately.

## Phase 4 — Meeting completion and administration

### Shared goal

Complete the meeting lifecycle and give the admin enough operational visibility for the MVP.

### Team Member 1 — Meeting list and one reschedule

**Branches, in order**

```text
feature/my-meetings
feature/reschedule-meeting
```

**Scope**

- Participant meeting list/page
- Meeting details needed by participants
- `POST /api/meetings/:id/reschedule`
- Only one rescheduling iteration
- Participant-only authorization

**Definition of Done**

- Mentor and mentee can see their scheduled meetings.
- Unrelated users cannot see or reschedule them.
- A second reschedule attempt is rejected.

### Team Member 2 — Attendance and feedback

**Branches, in order**

```text
feature/attendance-confirmation
feature/meeting-feedback
```

**Scope**

- `POST /api/meetings/:id/attendance`
- One attendance confirmation per participant
- Update completion/no-show state using the simplest agreed rule
- `POST /api/meetings/:id/feedback`
- One simple rating/text submission per participant
- Feedback-pending and feedback-complete presentation

**Definition of Done**

- Only participants can confirm attendance and provide feedback.
- Duplicate submissions are prevented.
- Feedback is accepted only at the appropriate meeting stage.

### Team Member 3 — Admin meetings, calendar, and alerts

**Branches, in order**

```text
feature/admin-meetings-list
feature/admin-meeting-details
feature/admin-calendar-view
feature/admin-alerts
```

**Scope**

- `GET /api/admin/meetings`
- Status, mentor, and mentee filters
- `GET /api/admin/meetings/:id`
- Simple calendar-style chronological/grouped view; do not add calendar integration
- `GET /api/admin/alerts`
- Simple derived alerts such as stale requests, waiting for slots, pending attendance, and pending feedback

**Definition of Done**

- Admin can filter and inspect meetings.
- Calendar-style view presents scheduled meetings clearly.
- Alerts are derived on request; no background queue is introduced.
- Non-admins receive 403.

### Phase 4 Definition of Done

- [ ] Scheduled meetings appear to both participants and the admin.
- [ ] One reschedule cycle works.
- [ ] Attendance and feedback work for both participants.
- [ ] Admin meeting filters, details, calendar-style view, and alerts work.
- [ ] Each feature has a separate branch and PR.

## Phase 5 — Integration and stabilization

### Shared goal

Test the application as one system and fix integration failures without creating a large shared “everything” branch.

### Team Member 1 — Happy-path integration

**Branches as defects are found**

```text
fix/happy-path-<short-description>
```

**Test focus**

- Register/login
- Mentor profile
- Browse mentor
- Request mentoring
- Offer/select slot
- Meeting visibility
- Attendance and feedback

### Team Member 2 — Rules, permissions, and failure paths

**Branches as defects are found**

```text
fix/authorization-<short-description>
fix/status-rule-<short-description>
```

**Test focus**

- Cross-user access attempts
- Cross-role access attempts
- Duplicate active request
- Past slots
- Selecting another request's slot
- Extra-slots limit
- Reschedule limit
- Capacity enforcement
- Duplicate attendance/feedback

### Team Member 3 — Admin, UI consistency, and responsive RTL

**Branches as defects are found**

```text
fix/admin-<short-description>
fix/ui-<short-description>
```

**Test focus**

- Admin lists, filters, details, calendar, and alerts
- Navigation by role
- Hebrew wording and RTL alignment
- Loading, empty, error, and not-found states
- Mobile and desktop layout

### Integration rules

- One bug or tightly related bug group per fix branch.
- Do not use one permanent `integration` branch.
- Merge high-impact backend/contract fixes first.
- After each shared fix, affected branches update from `main`.
- Freeze new features at the start of this phase.

### Phase 5 Definition of Done

- [ ] Complete happy path passes twice using fresh users.
- [ ] All critical business rules are verified server-side.
- [ ] No known blocker or data-corruption issue remains.
- [ ] UI works in Hebrew RTL at common desktop and mobile widths.
- [ ] All accepted fixes are merged into `main`.

## Phase 6 — Final QA, seed data, and documentation

### Shared goal

Make the MVP reproducible and demonstrable from a clean clone.

### Team Member 1 — Technical setup validation

**Branch**

```text
docs/final-setup-guide
```

**Tasks**

- Validate README commands from a clean state.
- Document prerequisites, environment variables, migration, seed, development, build, and test commands.
- Remove obsolete template instructions.

### Team Member 2 — Demo data and demo script

**Branches, in order**

```text
chore/final-demo-seed
docs/demo-script
```

**Tasks**

- Ensure deterministic sample users and workflow records exist.
- Document safe development credentials.
- Write a short demo sequence showing the MVP happy path.

### Team Member 3 — Final acceptance test and known limitations

**Branch**

```text
docs/final-qa-report
```

**Tasks**

- Run every agreed MVP test scenario.
- Record pass/fail results.
- Document non-blocking known limitations and future features without implementing them.

### Final merge gate

- [ ] Fresh clone setup succeeds.
- [ ] Migration and seed work on an empty database.
- [ ] Client and server start from documented commands.
- [ ] Build/type checks pass.
- [ ] Complete demo flow passes.
- [ ] Admin access and filters pass.
- [ ] Critical permission and business-rule tests pass.
- [ ] Documentation matches the actual repository.
- [ ] All feature and fix branches are merged or intentionally closed.
- [ ] `main` is clean and demo-ready.

## Shared files and conflict rules

| Shared file or area | Conflict risk | Rule |
|---|---|---|
| `schema.prisma` | Several features may need fields or relations | Propose first; create a small `db/<change>` branch; merge early; never edit a merged migration |
| Prisma migrations | Parallel ordering conflicts | Pull latest `main` before generating; one temporary migration coordinator reviews ordering |
| Root/client/server `package.json` | Dependency and script conflicts | Add only required packages; use a small `chore/dependency-<name>` branch when shared |
| Lockfiles | Generated conflicts | Same npm version; never hand-edit; regenerate after syncing with `main` |
| `App.tsx` and router indexes | Every feature needs navigation/routes | Keep route modules separate; central file receives only a small import/mount change |
| `server/src/app.ts` and main router | Every API feature must be mounted | Feature owns its router; central mount is a minimal isolated change |
| Global styles/theme | Unscoped changes can break all pages | Only global tokens/RTL belong there; feature styling stays within the feature |
| Shared roles/statuses | Different strings break contracts | Change only in a coordinated contract/schema PR |
| API contracts | Client/backend can diverge | Update contract in the same PR as a breaking change and notify affected owners |
| Seed script | Everyone may add scenarios | Divide it into domain helper functions and preserve existing records |
| `.env.example` | Missing keys block teammates | Add and document each variable in the same PR; never commit secrets |

## Prisma migration workflow during feature phases

1. Developer announces the required schema change.
2. Team confirms the name, type, relationship, and owning entity.
3. Developer creates a small branch such as `db/add-meeting-status` from current `main`.
4. Developer changes the schema and creates one descriptive migration.
5. Schema, migration, seed adjustment, and contract update are committed together when applicable.
6. PR is reviewed and merged before dependent feature branches progress too far.
7. All developers pull `main`, run migrations, and regenerate Prisma Client.
8. Never rewrite an already-merged migration; create a corrective migration.

## Scope protection

Do not add during this week:

- Email or WhatsApp automation
- Google Calendar or external calendar synchronization
- Background queues
- Advanced analytics or graphs
- Complex matching algorithms
- Refresh tokens, password reset, or email verification
- Payments or subscriptions
- Audit logs
- Complex attendance disputes
- Production deployment work

If time runs short, preserve this minimum flow:

```text
Register/login
→ mentor profile
→ browse mentor
→ request mentoring
→ mentor offers slots
→ mentee selects slot
→ meeting is visible
→ attendance
→ feedback
→ basic admin visibility
```

## Final working principle

At the start of each phase, each teammate creates only the first assigned feature branch from current `main`. After that feature is reviewed and merged, she pulls the new `main` and creates the next branch. This keeps branches short, changes focused, and conflicts much smaller than three week-long developer branches.
