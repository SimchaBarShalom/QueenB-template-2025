You are helping us build **Queens Match**, a three-person bootcamp project for matching mentors and mentees in a community.

## Most important instruction

We are intentionally building this project in **phases**.

### Phase 1 = SMALL WORKING MVP

Our immediate goal is:

> Build the simplest clean version of Queens Match that demonstrates the complete core flow from registration → mentor discovery → mentoring request → mentor proposes times → mentee chooses a time → meeting is scheduled.

We do **NOT** want to implement all of the final project requirements now.

Do not overengineer the MVP.

Do not build infrastructure for complex future requirements unless the MVP actually needs it.

At the same time, avoid decisions that would make the future features unnecessarily difficult to add.

Think:

**simple now, extensible later.**

---

# MVP Goal

The entire MVP user interface must be in Hebrew and use RTL layout.

A new developer should be able to run the application locally and perform this flow:

1. Register/login.
2. Create or edit a mentor profile.
3. Browse available mentors.
4. Open a mentor profile.
5. Request a mentoring meeting.
6. Mentor sees the incoming request.
7. Mentor either:
   - rejects it, or
   - proposes available meeting times.
8. Mentee sees the proposed times.
9. Mentee selects one.
10. The system records a scheduled meeting.
11. Both users can see the meeting and its current status.
12. Admin can see users and mentoring requests/meetings.

If this complete flow works reliably, Phase 1 is successful.

---

# MVP product scope

## 1. Authentication

Implement:

- registration
- login
- logout
- authenticated sessions/tokens according to the selected stack
- protected routes

Registration fields:

Required:

- email
- password
- username

Optional profile fields may initially include:

- programming languages / stack
- job title
- workplace
- years of experience
- profile image URL
- GitHub URL
- LinkedIn URL

Password handling must still follow proper security practices.

Never store plaintext passwords.

---

# 2. Users and roles

A user has one account.

A user may be:

- a regular user
- a mentor
- an admin

A mentor is not necessarily a completely separate account type.

For the MVP, keep the model simple while allowing a user to become a mentor by creating a mentor profile.

Do not build complicated role-management infrastructure unless required.

---

# 3. Mentor profile

A user can choose to become a mentor.

For the MVP, a mentor profile should contain:

- professional background
- mentoring topics
- short description
- preferred meeting duration

Optional if simple to implement:

- company
- technologies
- years of experience

The mentor can edit the profile later.

Do not implement complex mentor quotas/capacity rules in Phase 1.

---

# 4. Mentor discovery

Create a mentor listing page.

A mentee should be able to:

- see available mentors
- see basic mentor information
- open a mentor details page
- request a mentoring meeting

Basic filtering/search is optional.

Do not spend significant Phase 1 time building sophisticated search.

---

# 5. Mentoring request

A mentee can click something like:

**Request mentoring**

The system creates a mentoring request associated with:

- mentee
- mentor
- creation time
- current status

For the MVP, prevent obvious duplicate active requests between the same mentee and mentor if straightforward.

---

# 6. Mentor request management

The mentor should have a page showing incoming requests.

For each pending request, she can:

### Reject

The request becomes rejected.

The mentee can see that it was rejected.

OR

### Propose meeting times

The mentor can enter a few available date/time options.

For Phase 1, this does NOT need to be a sophisticated calendar.

A simple interface is perfectly acceptable, for example:

- date picker
- time picker
- "Add another option"

The mentor submits the options.

The request then waits for the mentee.

---

# 7. Mentee chooses a meeting time

The mentee sees the proposed times.

She selects one.

The system then creates or records the scheduled meeting.

The selected request becomes scheduled.

Both users should be able to see:

- mentor
- mentee
- date
- time
- status

Do not implement complicated calendar synchronization.

---

# 8. Basic meeting/request statuses

For the MVP, keep the workflow intentionally small.

A reasonable starting state model could be:

- `PENDING_MENTOR`
- `PENDING_MENTEE`
- `SCHEDULED`
- `REJECTED`

You may recommend slightly different naming if it better matches the chosen architecture.

Avoid adding the entire final-project state machine now.

Do not create statuses for future features that are not implemented yet.

The backend must remain the source of truth for status transitions.

---

# 9. User meetings page

Create a simple page such as:

`My Meetings`

or

`My Mentoring`

It should show requests/meetings relevant to the logged-in user.

Possible sections:

- Action required
- Waiting for the other side
- Scheduled
- Rejected

Keep this simple.

Do not create many nearly identical pages unnecessarily.

---

# 10. Admin MVP

The admin interface should initially be simple.

Implement:

### Users page

Show basic registered-user information.

### Meetings / mentoring requests page

Show:

- mentor
- mentee
- current status
- scheduled time if one exists

Allow basic filtering by status only if it is easy to add.

Admin detail pages are optional for the first MVP.

Do not build a sophisticated admin dashboard yet.

---

# NOT part of Phase 1

The following requirements belong to later phases.

Do NOT implement them unless we explicitly ask.

## WhatsApp integration

Do not implement:

- WhatsApp reminders
- WhatsApp attendance confirmation
- WhatsApp feedback requests
- WhatsApp thank-you messages

For the MVP, application UI state is enough.

---

## Automated notifications

Do not implement:

- background reminder jobs
- notifications every two days
- scheduled tasks
- cron jobs
- queues
- retry systems

These will be added later.

---

## Feedback system

Do not implement yet:

- post-meeting feedback
- feedback forms
- missing-feedback reminders

---

## Meeting completion flow

Do not implement yet:

- asking whether the meeting actually occurred
- "meeting did not happen" workflow
- automatic follow-up scheduling

---

## Complex rescheduling

Do not implement yet:

- one-reschedule limits
- rescheduling counters
- rescheduling after cancellation
- request-more-times limits

For the MVP, if scheduling needs to change, manual/simple cancellation is acceptable.

---

## Additional-time-slot business rules

Do not implement the final rule that the mentee may request extra slots only once.

That will be introduced when the scheduling workflow is expanded.

---

## Advanced admin alerts

Do not implement:

- missing feedback alerts
- meetings that failed to occur
- attendance alerts
- mentor reached 10 meetings alerts
- sophisticated alert deduplication

---

## Advanced admin calendar

Do not implement a complex calendar visualization yet.

A list/table of scheduled meetings is sufficient.

---

## Attendance confirmation

Do not implement:

- mentor confirms attendance
- mentee confirms attendance
- pre-meeting confirmation states

---

## Sophisticated capacity rules

Do not implement rules such as:

- mentor can provide X total meetings
- monthly quotas
- lifetime quotas
- complex capacity calculations

---

## Chatbot / AI features

Do not implement.

---

## AI-generated images

Do not implement.

---

## Advanced deployment/infrastructure

Do not introduce:

- microservices
- Redis
- Kafka
- message queues
- Kubernetes
- complex event systems
- distributed architecture

unless the chosen technology genuinely requires something equivalent.

This is a bootcamp MVP.

---

# Important engineering principle

Do not confuse:

**"we might need this later"**

with:

**"we need to build this now."**

When making an architectural decision, ask:

> What is the simplest implementation that satisfies the current MVP while leaving us a reasonable path to extend it?

Do not create abstractions solely because a future feature might possibly need them.

---

# Architecture expectations for MVP

We want a clean conventional architecture, not an impressive architecture.

Prefer:

- clear frontend/backend separation
- sensible folder structure
- validation
- authentication
- authorization
- database migrations
- readable service/business logic
- centralized error handling where appropriate
- basic reusable components

Avoid:

- unnecessary design patterns
- too many abstraction layers
- generic repository frameworks
- premature event-driven architecture
- complicated dependency injection systems unless normal for the chosen stack

---

# Database design philosophy

Design only for the MVP entities we currently need.

Likely concepts include:

- User
- MentorProfile
- MentoringRequest
- AvailabilitySlot

Potentially:

- Meeting

Before creating both `MentoringRequest` and `Meeting`, determine whether having two separate entities currently provides enough benefit.

Do not introduce tables for:

- feedback
- WhatsApp messages
- admin alerts
- reminder jobs
- attendance confirmation

until those features are implemented.

The schema should remain easy to migrate later.

---

# Suggested MVP domain flow

The initial flow should remain approximately:

```text
Mentee
  ↓
Browse Mentors
  ↓
Choose Mentor
  ↓
Create Request
  ↓
PENDING_MENTOR
  ↓
Mentor reviews request
  ├───────────────┐
  ↓               ↓
Reject        Propose Times
  ↓               ↓
REJECTED      PENDING_MENTEE
                  ↓
             Mentee chooses
                  ↓
               SCHEDULED
```

This is intentionally much smaller than the final system.

---

# Basic permissions

Even though this is an MVP, authorization must be correct.

Examples:

A mentee may:

- create a request
- see her own requests
- select a proposed slot for her own request

A mentor may:

- see requests sent to her
- reject her own incoming requests
- propose times for her own incoming requests

A user must NOT be able to:

- modify another user's mentoring request
- select a time for someone else's meeting
- impersonate another mentor

An admin may access admin routes.

Do not sacrifice basic security just because this is an MVP.

---

# Testing scope

We DO want tests in Phase 1.

But focus them on important behavior.

Prioritize tests for:

- registration/login
- authorization
- creating mentor profile
- creating mentoring request
- mentor rejecting request
- mentor proposing times
- mentee selecting a time
- unauthorized user attempting to modify another request
- important state transitions

Do not try to achieve arbitrary 100% test coverage.

Test important behavior.

---

# UI expectations

Language and localization

The entire user-facing application must be in Hebrew.

Requirements:

All visible UI text should be in Hebrew.
The layout must support RTL (right-to-left).
Forms, buttons, navigation, tables, dialogs, validation messages, empty states and error messages should all be displayed in Hebrew.
Dates and times should be presented in a format natural for Israeli users.
Do not mix English and Hebrew in the UI unless the term is a technical term that is commonly written in English, such as GitHub or LinkedIn.
Internal code, variable names, database fields and API names should remain in English.
The MVP does not require a multilingual/i18n system unless we explicitly request it later.

The UI should initially prioritize:

1. clarity
2. usability
3. working flows
4. responsiveness

over highly polished visual design.

Use simple components.

Important states should still be handled:

- loading
- error
- empty
- success
- unauthorized

Do not spend excessive development time on animations or elaborate styling before the workflow works.

---

# Development order

Build the MVP incrementally.

Recommended order:

## Step 1

Project structure + development environment.

## Step 2

Database + User model.

## Step 3

Authentication.

Verify registration/login work.

## Step 4

Mentor profile.

Verify a user can become/edit a mentor.

## Step 5

Mentor discovery.

Verify users can browse mentors.

## Step 6

Create mentoring request.

Verify mentee → mentor request works.

## Step 7

Mentor request page.

Verify mentor can see and reject requests.

## Step 8

Mentor proposes times.

Verify data is persisted.

## Step 9

Mentee selects time.

Verify request becomes scheduled.

## Step 10

My Meetings page.

Verify both participants see the correct state.

## Step 11

Basic admin pages.

## Step 12

Tests, bug fixes, cleanup and documentation.

At every step, keep the application runnable.

Do not generate the entire project in one enormous implementation pass.

---

# Vertical slices

Because this is a three-person bootcamp team, prefer dividing work into vertical features rather than:

Developer A = frontend only  
Developer B = backend only  
Developer C = database only

For example:

### Feature A — Mentor Profile

Includes:

- database
- API/backend
- frontend
- tests

### Feature B — Mentor Discovery

Includes:

- API
- frontend
- tests

### Feature C — Mentoring Requests

Includes:

- database
- API
- frontend
- tests

This lets every team member practice multiple parts of the stack.

---

# Future phases

We expect to expand the application after the MVP works.

Likely future phases will include:

## Phase 2 — Better scheduling

- request additional times
- rescheduling
- scheduling limits
- more complete state machine

## Phase 3 — Meeting lifecycle

- attendance confirmation
- meeting occurred/not occurred
- feedback

## Phase 4 — Messaging and automation

- WhatsApp integration
- reminders
- recurring jobs
- thank-you messages

## Phase 5 — Admin operations

- admin alerts
- advanced filtering
- calendar
- meeting details
- user statistics

## Phase 6 — Polish / stretch

- deployment improvements
- chatbot
- AI features
- advanced UX

These phases are directional only.

Do NOT implement them merely because they are documented here.

---

# How the AI agent should behave

When working on Phase 1:

1. Always prioritize getting the end-to-end MVP working.
2. Avoid solving Phase 2 problems prematurely.
3. Do not add infrastructure just because it might be useful later.
4. Keep business logic understandable.
5. Keep the application runnable after each feature.
6. Prefer small pull requests.
7. Add meaningful tests.
8. Flag ambiguities instead of inventing important requirements.
9. Do not refactor unrelated code.
10. Keep future extensibility in mind without building future functionality.

When choosing between:

### Option A
A simple implementation that works now and can reasonably be extended later.

and

### Option B
A sophisticated implementation designed for every future requirement.

Choose **Option A**.

---

# Before generating the repository

First read:

- `AGENTS.md`
- all files under `/docs`

Then:

1. Summarize your understanding of the MVP.
2. Identify the minimum entities required.
3. Identify the minimum pages required.
4. Identify the minimum API surface required.
5. Propose the repository/folder structure.
6. Identify anything in our documentation that unnecessarily belongs to a later phase.
7. Point out major unresolved architectural decisions.
8. Recommend the smallest sensible initial implementation plan.

Do NOT immediately generate the entire application.

First make sure the repository structure and MVP boundaries are consistent with these instructions.

The guiding principle for the entire first phase is:

# WORKING SIMPLE MVP FIRST. COMPLEXITY LATER.