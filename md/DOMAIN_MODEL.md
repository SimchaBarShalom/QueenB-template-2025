# Queens Match — Domain Model

## 1. User

One account represents one person.

```text
User
- id
- email
- passwordHash
- username
- isAdmin
- createdAt
- updatedAt
```

Optional profile fields may be added only if used by the MVP UI:
- jobTitle
- workplace
- yearsOfExperience
- profileImageUrl
- githubUrl
- linkedinUrl

### Rules
- `email` must be unique.
- A user becomes a mentor by creating a `MentorProfile`.
- Do not create separate Mentor and Mentee account tables.
- A user must not request mentoring from herself.

---

## 2. MentorProfile

```text
MentorProfile
- id
- userId
- professionalBackground
- mentoringTopics
- description
- preferredMeetingDuration
- company? 
- technologies?
- yearsOfExperience?
- createdAt
- updatedAt
```

### Relations
- `User 1 → 0..1 MentorProfile`
- `userId` is unique.

---

## 3. MentoringRequest

This is the central Phase 1 workflow entity.

```text
MentoringRequest
- id
- menteeId
- mentorId
- status
- scheduledAt?
- createdAt
- updatedAt
```

### Status

```text
PENDING_MENTOR
PENDING_MENTEE
SCHEDULED
REJECTED
```

### Allowed transitions

```text
PENDING_MENTOR
├── reject ─────────────→ REJECTED
└── propose times ──────→ PENDING_MENTEE
                           └── choose time ─→ SCHEDULED
```

The backend must enforce these transitions.

### Rules
- Only the mentee can create her request.
- Only the target mentor can reject it or propose times.
- Only the request's mentee can choose a proposed time.
- Prevent more than one active request for the same mentor/mentee pair when practical.
- `scheduledAt` is set only when a valid proposed slot is selected.

---

## 4. AvailabilitySlot

```text
AvailabilitySlot
- id
- mentoringRequestId
- startsAt
- createdAt
```

### Rules
- Slots belong to one mentoring request.
- Only the request's mentor can create them.
- Slots can be added only while the request is `PENDING_MENTOR`.
- When the mentor submits valid slots, the request becomes `PENDING_MENTEE`.
- The mentee may select only a slot belonging to her request.
- Selecting a slot copies `startsAt` to `MentoringRequest.scheduledAt` and changes the status to `SCHEDULED`.

---

## No Separate Meeting Entity Yet

Phase 1 does **not** need a separate `Meeting` table.

A scheduled mentoring request represents the meeting:

```text
MentoringRequest
status = SCHEDULED
scheduledAt = <selected time>
```

Create a separate `Meeting` entity later only if meeting lifecycle features make it useful.

## Permissions Summary

| Action | Mentee | Mentor | Admin |
|---|---|---|---|
| Browse mentors | Yes | Yes | Yes |
| Create mentoring request | Own request | Yes, as a mentee | No special need |
| Reject request | No | Own incoming request | No special need |
| Propose slots | No | Own incoming request | No special need |
| Select slot | Own request | No | No special need |
| View own requests | Yes | Yes | Yes |
| View all users/requests | No | No | Yes |
