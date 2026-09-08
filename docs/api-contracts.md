# Queens Match API Contracts

## Current Base API

The current base implementation uses Express, Prisma, PostgreSQL, and JSON responses.

Base URL in local development:

```text
http://localhost:5000
```

When the React client runs through Create React App, API calls may use relative paths such as `/api/auth/login` because `client/package.json` proxies to the server.

## General Rules

- Request and response bodies are JSON.
- Dates are ISO 8601 strings.
- Password hashes must never be returned.
- Errors use one of these shapes:

```json
{
  "error": "Human readable message"
}
```

```json
{
  "errors": ["First validation error", "Second validation error"]
}
```

## Roles

Supported roles:

```text
MENTEE
MENTOR
ADMIN
```

Only `MENTEE` and `MENTOR` can register through the public registration form.

`ADMIN` users are created through seed data.

## User Object

Safe user responses use this shape:

```json
{
  "id": 1,
  "email": "mentee@queenb.org",
  "firstName": "Mentee",
  "lastName": "Example",
  "role": "MENTEE",
  "createdAt": "2026-09-03T12:00:00.000Z"
}
```

Do not expose:

```text
passwordHash
```

## Health

### `GET /api/health`

Response `200`:

```json
{
  "message": "QueenB Server is running!",
  "timestamp": "2026-09-03T12:00:00.000Z",
  "status": "healthy"
}
```

## Auth

### `POST /api/auth/register`

Registers a mentee or mentor.

Request:

```json
{
  "firstName": "Dana",
  "lastName": "Levi",
  "email": "dana@example.com",
  "password": "StrongPass123!",
  "role": "MENTEE"
}
```

Response `201`:

```json
{
  "user": {
    "id": 1,
    "email": "dana@example.com",
    "firstName": "Dana",
    "lastName": "Levi",
    "role": "MENTEE",
    "createdAt": "2026-09-03T12:00:00.000Z"
  }
}
```

Validation response `400`:

```json
{
  "errors": ["Password must be at least 8 characters"]
}
```

Duplicate email response `409`:

```json
{
  "error": "Email already exists"
}
```

### `POST /api/auth/login`

Request:

```json
{
  "email": "mentee@queenb.org",
  "password": "Mentee123!"
}
```

Response `200`:

```json
{
  "user": {
    "id": 1,
    "email": "mentee@queenb.org",
    "firstName": "Mentee",
    "lastName": "Example",
    "role": "MENTEE",
    "createdAt": "2026-09-03T12:00:00.000Z"
  }
}
```

Invalid credentials response `401`:

```json
{
  "error": "Invalid email or password"
}
```

## Auth Scope Decision Before Phase 2

The current base implementation has basic registration and login, but it does not have real session security yet. The frontend stores the returned user in `localStorage`, and the server does not verify a token on protected routes.

Before Phase 2 feature work splits across three members, add one shared auth foundation branch:

```text
chore/auth-middleware-and-me
```

That branch should add:

- JWT creation on register/login.
- `GET /api/auth/me`.
- Express authentication middleware.
- Express role middleware.
- Frontend auth state that restores the user after refresh by calling `/api/auth/me`.
- A shared Axios client that attaches the JWT.
- Protected frontend routes for logged-in users.
- Admin-only frontend routes for admin pages.

Recommended token response shape after this upgrade:

```json
{
  "user": {
    "id": 1,
    "email": "mentee@queenb.org",
    "firstName": "Mentee",
    "lastName": "Example",
    "role": "MENTEE",
    "createdAt": "2026-09-03T12:00:00.000Z"
  },
  "token": "jwt-token"
}
```

Recommended authenticated request header:

```text
Authorization: Bearer jwt-token
```

Recommended `GET /api/auth/me` response:

```json
{
  "user": {
    "id": 1,
    "email": "mentee@queenb.org",
    "firstName": "Mentee",
    "lastName": "Example",
    "role": "MENTEE",
    "createdAt": "2026-09-03T12:00:00.000Z"
  }
}
```

This should be done before mentor/admin/mentee feature branches start because all Phase 2 features need consistent role checks.

## Future Phase 2 Endpoints

These are planned but not implemented in the base:

```text
GET /api/mentor-profile/me
PUT /api/mentor-profile/me
GET /api/mentors
GET /api/mentors/:id
GET /api/admin/users
GET /api/admin/users/:id
```

All future protected endpoints should require JWT authentication. Admin endpoints should also require `ADMIN` role.
