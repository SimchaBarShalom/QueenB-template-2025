# Queens Match — User Flows

## Flow 1 — Register / Login

1. User opens `/register`.
2. Enters email, password, username.
3. Backend validates the input and creates the account.
4. Password is stored only as a hash.
5. User logs in and receives an authenticated HttpOnly cookie.
6. Authenticated pages become available.

**Failure cases:** invalid input, duplicate email, wrong credentials.

---

## Flow 2 — Become a Mentor

1. Logged-in user opens `/mentor-profile`.
2. Fills in mentor information.
3. Saves the profile.
4. Backend creates `MentorProfile`.
5. User now appears in `/mentors`.
6. Returning to the page edits the same profile.

---

## Flow 3 — Find a Mentor and Request Mentoring

1. Mentee opens `/mentors`.
2. Opens `/mentors/:mentorId`.
3. Clicks **Request mentoring**.
4. Backend verifies:
   - user is authenticated
   - mentor exists
   - user is not requesting herself
   - no duplicate active request exists
5. Backend creates:

```text
status = PENDING_MENTOR
```

6. Request appears in both users' `/my-mentoring` page.

---

## Flow 4A — Mentor Rejects

1. Mentor opens `/my-mentoring`.
2. Opens an incoming `PENDING_MENTOR` request.
3. Clicks **Reject**.
4. Backend verifies she is the target mentor.
5. Status becomes:

```text
REJECTED
```

6. Both users see the updated state.

---

## Flow 4B — Mentor Proposes Times

1. Mentor opens an incoming `PENDING_MENTOR` request.
2. Adds several date/time options.
3. Submits them.
4. Backend validates that all times are valid future timestamps.
5. Slots are saved.
6. Request becomes:

```text
PENDING_MENTEE
```

7. Mentee sees the proposed options in `/my-mentoring`.

No advanced calendar is required; date/time inputs are enough.

---

## Flow 5 — Mentee Chooses a Time

1. Mentee opens her `PENDING_MENTEE` request.
2. Selects one proposed slot.
3. Backend verifies:
   - she owns the request
   - request is `PENDING_MENTEE`
   - selected slot belongs to this request
4. Backend sets:

```text
scheduledAt = selectedSlot.startsAt
status = SCHEDULED
```

5. Both users see the scheduled date/time.

---

## Flow 6 — My Mentoring

`/my-mentoring` loads all requests where the current user is the mentee or mentor.

Group them into:

```text
Action required
Waiting
Scheduled
Rejected
```

Suggested mapping:
- Mentor + `PENDING_MENTOR` → Action required
- Mentee + `PENDING_MENTEE` → Action required
- Mentee + `PENDING_MENTOR` → Waiting
- Mentor + `PENDING_MENTEE` → Waiting
- `SCHEDULED` → Scheduled
- `REJECTED` → Rejected

---

## Flow 7 — Admin

1. Admin opens `/admin/users` to see registered users.
2. Admin opens `/admin/requests` to see mentoring requests.
3. Non-admin users receive `403 Forbidden` from admin APIs even if they manually enter the URL.

Admin Phase 1 is read-only.
