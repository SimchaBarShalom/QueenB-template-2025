# Queens Match MVP Test Scenarios

## Base Foundation Scenarios

Run these before splitting Phase 2 work.

### Setup

1. Clone or pull the repository.
2. Install dependencies:

   ```bash
   npm run install-all
   ```

3. Configure the server environment:

   ```bash
   cd server
   cp .env.example .env
   ```

4. Edit `server/.env` with the local `DATABASE_URL`.
5. Run database setup:

   ```bash
   npm run prisma:migrate
   npm run prisma:seed
   ```

6. Start the app:

   ```bash
   cd ..
   npm run dev
   ```

Expected result:

- Server starts on `http://localhost:5000`.
- Client starts on `http://localhost:3000`.
- No real secrets are committed.

### Health Check

Open:

```text
http://localhost:5000/api/health
```

Expected result:

- HTTP `200`.
- Response status is `healthy`.

### Seeded Login

Use the seeded users:

```text
admin@queenb.org / Admin123!
mentor@queenb.org / Mentor123!
mentee@queenb.org / Mentee123!
```

Expected result:

- Login succeeds.
- Profile page shows the correct email and role.
- Response does not expose `passwordHash`.

### Mentee Registration

Register through:

```text
/register/mentee
```

Use a new email and a password with at least 8 characters.

Expected result:

- Registration succeeds.
- User is saved with role `MENTEE`.
- Profile page opens after registration.

### Mentor Registration

Register through:

```text
/register/mentor
```

Use a new email and a password with at least 8 characters.

Expected result:

- Registration succeeds.
- User is saved with role `MENTOR`.
- Profile page opens after registration.

### Duplicate Email

Try registering with an email that already exists.

Expected result:

- Registration fails.
- Error message says the email already exists.

### Validation Errors

Try registering with:

- First name shorter than 2 characters.
- Last name shorter than 2 characters.
- Invalid email.
- Password shorter than 8 characters.

Expected result:

- Registration fails.
- The page shows a clear validation message.

### Database Error Message

Temporarily use an invalid `DATABASE_URL` in `server/.env`, then try registration.

Expected result:

- Registration fails.
- The page shows that the server cannot connect to the database.

Undo the invalid `DATABASE_URL` after this test.

## Phase 2 Readiness Scenarios

These should pass after the recommended `chore/auth-middleware-and-me` branch.

### Restore User On Refresh

1. Log in.
2. Open `/profile`.
3. Refresh the browser.

Expected result:

- The app calls `GET /api/auth/me`.
- The user remains logged in.

### Block Anonymous Protected Access

Open a protected page without logging in.

Expected result:

- The user is redirected to login or shown an access message.
- Protected API endpoints return `401`.

### Block Non-Admin Admin Access

Log in as a mentee or mentor and open an admin page/API.

Expected result:

- Frontend blocks or redirects the user.
- Admin API endpoints return `403`.

### Allow Admin Access

Log in as the seeded admin.

Expected result:

- Admin placeholder or admin pages are accessible.
- Admin-only APIs return data.

## Full MVP Happy Path

These scenarios are for later phases.

1. Mentee registers or logs in.
2. Mentor registers or logs in.
3. Mentor creates a mentor profile.
4. Mentee browses mentors.
5. Mentee opens mentor details.
6. Mentee sends a mentoring request.
7. Mentor sees the incoming request.
8. Mentor offers future meeting slots.
9. Mentee selects one slot.
10. Meeting is created and visible to both participants.
11. One participant requests one reschedule if needed.
12. Participants confirm attendance.
13. Participants submit feedback.
14. Admin reviews users, meetings, filters, calendar view, and alerts.

## Business Rule Scenarios

These should be implemented and tested during feature phases:

- Mentee cannot create duplicate active requests to the same mentor.
- Mentor cannot offer slots in the past.
- Mentee cannot select a slot from another request.
- Mentee can request more slots only once.
- Meeting can be rescheduled only once.
- Mentor capacity is enforced server-side.
- Non-admin users cannot access admin APIs.
- Users cannot update another user's private data.
- Only meeting participants can confirm attendance.
- Only meeting participants can submit feedback.
