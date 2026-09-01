# Queens Match — UI Pages

## Global UI Rules

- User-facing text: **Hebrew**
- Layout direction: **RTL**
- Mobile-friendly and desktop-friendly
- Prefer clear forms, cards, tables, and buttons over complex visuals
- Every data page must handle:
  - loading
  - error
  - empty state
  - success feedback where relevant
- Do not build animations or advanced design before the workflow works.

## Routes

### `/`
Redirect authenticated users to `/mentors`.
Unauthenticated users go to `/login`.

---

### `/register`

**Purpose:** create an account.

**Fields:**
- username
- email
- password

**Actions:**
- Register
- Link to login

**Validation:**
- required fields
- valid email
- password requirements
- show backend errors clearly

---

### `/login`

**Purpose:** authenticate an existing user.

**Fields:**
- email
- password

**Actions:**
- Login
- Link to register

---

### `/mentors`

**Purpose:** browse available mentors.

**Show on each mentor card:**
- username
- professional background
- mentoring topics
- short description
- preferred meeting duration

**Action:**
- View mentor

Search/filtering is optional for Phase 1.

---

### `/mentors/:mentorId`

**Purpose:** view one mentor and request mentoring.

**Show:**
- username
- professional background
- topics
- description
- duration
- optional company/technologies/experience

**Action:**
- Request mentoring

**Rules:**
- Hide/disable the request action for the mentor herself.
- Show a clear message if an active request already exists.

---

### `/mentor-profile`

**Purpose:** become a mentor or edit the current mentor profile.

**Fields:**
- professional background
- mentoring topics
- short description
- preferred meeting duration
- optional company
- optional technologies
- optional years of experience

Use the same page for create and edit.

---

### `/my-mentoring`

**Purpose:** manage all mentoring requests relevant to the logged-in user.

Use one page with sections/tabs:

1. **Action required**
2. **Waiting**
3. **Scheduled**
4. **Rejected**

Each item should show:
- other participant
- current status
- created date
- scheduled date/time if available

#### Mentor action for `PENDING_MENTOR`
- Reject
- Propose times

#### Propose-times UI
- date input
- time input
- Add another option
- Remove option
- Submit options

#### Mentee action for `PENDING_MENTEE`
- show proposed slots
- select one
- confirm selection

Do not create separate pages for each request status.

---

### `/admin/users`

**Access:** admin only.

**Purpose:** basic registered-user list.

**Columns:**
- username
- email
- mentor: yes/no
- admin: yes/no
- created date

Read-only in Phase 1.

---

### `/admin/requests`

**Access:** admin only.

**Purpose:** basic mentoring request list.

**Columns:**
- mentee
- mentor
- status
- created date
- scheduled date/time

Optional:
- simple status filter

Read-only in Phase 1.

## Shared Components

Create reusable components only when they are actually reused, for example:
- `AppLayout`
- `Navbar`
- `ProtectedRoute`
- `AdminRoute`
- `MentorCard`
- `StatusBadge`
- `LoadingState`
- `ErrorMessage`
- `EmptyState`

Do not build a large design system for Phase 1.
