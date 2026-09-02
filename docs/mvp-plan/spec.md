# Queens Match - MVP Specification

## Technology Choices
| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | React 18 | Already used by the QueenB template |
| UI library | Material UI | Already installed and good for forms, cards, tables, and tabs |
| Backend | Node.js + Express | Already used by the QueenB template |
| Database | Local MongoDB | Chosen for the student project and can run on each computer |
| Database library | Mongoose | Defines schemas and connects Express to MongoDB |
| Authentication | JWT | Simple token-based auth for protected routes |
| Password security | bcrypt | Stores password hashes instead of plaintext passwords |

Each student should create her own `.env` file locally. The shared docs should explain needed environment variables, but actual secrets should not be committed.

Required environment values:

| Name | Purpose |
| --- | --- |
| `MONGO_URI` | Local MongoDB connection string |
| `JWT_SECRET` | Secret used to sign login tokens |
| `ADMIN_EMAIL` | Email that becomes admin when registering |

## Data Model
### User
Represents one person in the system.

Fields:
- id
- email
- passwordHash
- username
- isAdmin
- createdAt
- updatedAt

Rules:
- Email must be unique.
- Password must never be stored as plaintext.
- A user becomes a mentor by creating a mentor profile.
- Do not create separate mentor and mentee user tables.

Optional profile fields may be added only if used by the MVP UI:
- job title
- workplace
- years of experience
- profile image URL
- GitHub URL
- LinkedIn URL

### Mentor Profile
Represents the mentoring information of a user who wants to mentor.

Fields:
- id
- userId
- professional background
- mentoring topics
- short description
- preferred meeting duration
- company
- technologies
- years of experience
- createdAt
- updatedAt

Rules:
- One user can have zero or one mentor profile.
- The mentor can edit her profile later.
- A user cannot request mentoring from herself.

### Mentoring Request
Represents the workflow between one mentee and one mentor.

Fields:
- id
- menteeId
- mentorId
- status
- scheduledAt
- extraTimesRequested
- rescheduleUsed
- rescheduleRequestedBy
- createdAt
- updatedAt

Statuses:
| Status | Meaning |
| --- | --- |
| `PENDING_MENTOR` | Mentee requested mentoring and the mentor needs to respond |
| `PENDING_MENTEE` | Mentor proposed times and the mentee needs to choose |
| `SCHEDULED` | Mentee chose a time and the meeting is scheduled |
| `REJECTED` | Mentor rejected the request or the flow ended |
| `RESCHEDULE_REQUESTED` | A scheduled meeting needs one allowed reschedule |

Rules:
- Only the mentee can create her request.
- Only the target mentor can reject or propose times.
- Only the request's mentee can select a proposed time.
- Same mentee cannot create a duplicate active request to the same mentor.
- Scheduled time is set only from a valid proposed slot.
- Either participant can request one reschedule after scheduling.
- A second reschedule is blocked.

### Availability Slot
Represents a time option proposed by a mentor.

Fields:
- id
- mentoringRequestId
- startsAt
- isSelected
- createdAt

Rules:
- Slots belong to one mentoring request.
- Only the request's mentor can create slots.
- Slot times must be in the future.
- Mentee can select only a slot belonging to her request.
- Selecting a slot sets the request's scheduled time.

## Pages
All user-facing text should be Hebrew and the layout should be RTL.

| Route | Purpose |
| --- | --- |
| `/` | Redirect authenticated users to mentors and unauthenticated users to login |
| `/register` | Create account |
| `/login` | Login |
| `/mentors` | Browse mentor cards |
| `/mentors/:mentorId` | View mentor details and request mentoring |
| `/mentor-profile` | Become a mentor or edit mentor profile |
| `/my-mentoring` | Manage requests relevant to the logged-in user |
| `/admin/users` | Admin-only users list |
| `/admin/requests` | Admin-only requests/meetings list |

Every data page should include loading, error, empty, and success states where relevant.

## API Contract In Words
### Auth API
- Register creates a user, hashes the password, marks admin if email equals `ADMIN_EMAIL`, and returns a login token.
- Login validates email/password and returns a login token.
- Me returns the currently authenticated user from the token.

### Mentor API
- List mentors returns all users who created mentor profiles.
- Mentor details returns one mentor profile with user information.
- My mentor profile returns the logged-in user's mentor profile.
- Create/update mentor profile lets a logged-in user become a mentor or edit her mentor details.

### Request API
- Create request lets a logged-in mentee request a mentor.
- My requests returns requests where the logged-in user is either mentee or mentor.
- Reject request lets only the mentor reject while waiting for mentor action.
- Propose slots lets only the mentor submit future time options.
- Select slot lets only the mentee choose one proposed option.
- Request more times lets the mentee ask once for new mentor time options.
- Request reschedule lets either participant ask once to reschedule after a meeting is scheduled.

### Admin API
- Users list returns all users with whether they are mentors/admins and how many meetings they participated in.
- Requests list returns all mentoring requests with participants, status, created date, and scheduled time.

## User Flow
1. User registers or logs in.
2. User can create a mentor profile if she wants to mentor.
3. Mentee browses available mentors.
4. Mentee opens mentor details.
5. Mentee clicks request mentoring.
6. Request becomes `PENDING_MENTOR`.
7. Mentor sees the request in My Mentoring.
8. Mentor either rejects or proposes time options.
9. If rejected, request becomes `REJECTED`.
10. If times are proposed, request becomes `PENDING_MENTEE`.
11. Mentee selects one time.
12. Request becomes `SCHEDULED`.
13. If no proposed time works, mentee can request more times once.
14. After scheduling, either participant can request one reschedule.
15. Mentor proposes new times again.
16. Mentee chooses a new time.

## Acceptance Criteria
- A new user can register and login.
- A logged-in user can create and edit a mentor profile.
- Another user can browse mentors and view details.
- Mentee can create a request.
- Mentor can reject a request.
- Mentor can propose future slots.
- Mentee can choose a proposed slot.
- Mentee can request more times once.
- Either participant can request one reschedule.
- Second reschedule attempt is blocked.
- Both users see correct request status.
- Admin can view users and requests.
- Users cannot modify requests that do not belong to them.
