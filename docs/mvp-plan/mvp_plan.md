# Queens Match - One Week MVP Plan

## Working Agreement
The team has three students and one week. Each student should be able to run the whole project locally, but each student owns a different vertical feature area.

Use branches and pull requests:
- Do not work directly on `main`.
- Pull from `main` before starting each work session.
- Commit small changes.
- Open pull requests early.
- At least one teammate reviews each pull request.
- Merge only after the app still runs locally.

## Local Setup On Each Computer
Each student should:

1. Clone the same GitHub repository.
2. Install root, server, and client dependencies.
3. Install and run local MongoDB.
4. Create a local server `.env` file.
5. Run backend and frontend locally.
6. Register test users for mentor, mentee, and admin.

Each student has her own local database. This is okay for development. Shared behavior is controlled by the code and docs, not by sharing one database.

## Branches
| Student | Branch | Ownership |
| --- | --- | --- |
| Student 1 | `feature/auth-users` | Auth, users, admin flag, route protection |
| Student 2 | `feature/mentor-profiles` | Mentor profile, mentor list, mentor details |
| Student 3 | `feature/requests-admin` | Requests, slots, reschedule, My Mentoring, admin pages |

Before implementation starts, all students must read:
- `docs/mvp-plan/intent.md`
- `docs/mvp-plan/spec.md`
- `docs/mvp-plan/mvp_plan.md`

## Orchestrator Role
The orchestrator is responsible for keeping the project coordinated.

Orchestrator tasks:
- Keep the documentation updated.
- Make sure implementation matches the PDF assignment.
- Decide merge order.
- Review pull requests for conflicts with the spec.
- Keep future features out of the MVP.
- Check that each student can run the project locally.
- Confirm that backend statuses and frontend labels stay consistent.

## Sub-Agent Plan
When using AI agents, use one orchestrator and three focused subagents.

### Orchestrator Agent
Responsibilities:
- Reads all planning docs and the PDF requirements.
- Assigns work to subagents.
- Checks that each subagent stays inside its feature boundary.
- Reviews integration points.
- Produces final review before merge.

### Auth Subagent
Responsibilities:
- User model.
- Register/login/logout behavior.
- JWT middleware.
- Admin authorization.
- Shared frontend auth state.

Boundaries:
- Does not build mentor pages.
- Does not build request workflow.

### Mentor Subagent
Responsibilities:
- Mentor profile create/edit.
- Mentor list page.
- Mentor detail page.
- Request button placement.

Boundaries:
- Does not implement request status transitions.
- Does not implement admin pages.

### Workflow Subagent
Responsibilities:
- Mentoring request model.
- Proposed time slots.
- My Mentoring page.
- More-times request.
- One reschedule.
- Admin users and requests pages.

Boundaries:
- Does not change auth behavior except using existing protected routes.
- Does not change mentor profile schema without team agreement.

## Suggested Merge Order
1. Merge auth/users first.
2. Merge mentor profiles second.
3. Merge request workflow third.
4. Merge admin pages and final integration last.

This order reduces conflicts because later work depends on knowing the logged-in user and mentor profile shape.

## Daily Plan
### Day 1
- Confirm MVP scope.
- Create shared docs.
- Set up local project on all three computers.
- Create branches.
- Agree on data model and status names.

### Day 2
- Student 1 builds auth and user persistence.
- Student 2 starts mentor profile UI and backend shape.
- Student 3 starts request workflow planning and admin page structure.

### Day 3
- Student 1 finishes protected routes and auth context.
- Student 2 connects mentor profile to backend.
- Student 3 connects request model to mentor/mentee IDs.

### Day 4
- Merge auth.
- Merge mentor profile and mentor discovery.
- Student 3 integrates request creation and mentor response.

### Day 5
- Finish proposed slots and mentee selection.
- Finish My Mentoring page.
- Add more-times request and one reschedule.

### Day 6
- Add admin users and requests pages.
- Fix permission bugs.
- Run full demo flow with at least three users.

### Day 7
- Bug fixes.
- Code review.
- Clean UI text.
- Prepare demo script.
- Confirm MVP acceptance criteria.

## Demo Script
1. Register admin user.
2. Register mentor user.
3. Mentor creates mentor profile.
4. Register mentee user.
5. Mentee browses mentors.
6. Mentee requests mentoring.
7. Mentor sees request.
8. Mentor proposes times.
9. Mentee selects a time.
10. Both users see scheduled status.
11. Show one reschedule.
12. Show admin users page.
13. Show admin requests page.

## Conflict Prevention
- Do not rename shared status values without team agreement.
- Do not edit another student's files unless discussed.
- Keep formatting changes separate from feature changes.
- Pull from `main` before opening a pull request.
- If two students need the same file, coordinate first.
- Review backend response shapes before frontend depends on them.

## MVP Completion Checklist
- Auth works.
- Database connection works locally.
- Mentor profile works.
- Mentor list/details work.
- Request creation works.
- Mentor reject/propose flow works.
- Mentee selection works.
- More-times request works once.
- Reschedule works once.
- Admin pages work.
- Permissions are enforced.
- Hebrew RTL UI is usable.
- All three students can run the project locally.
