# Queens Match — Tech Stack

## Chosen Stack

### Frontend
- **React**
- **TypeScript**
- **Vite**
- **React Router**
- Native `fetch` for API calls
- Plain CSS / CSS Modules

### Backend
- **Node.js**
- **TypeScript**
- **Express**
- **Zod** for request validation

### Database
- **PostgreSQL**
- **Prisma ORM**
- Prisma migrations for every schema change

### Authentication
- Password hashing: **bcrypt**
- Auth token: **JWT**
- Store the token in an **HttpOnly cookie**
- No refresh-token system in Phase 1
- Authorization must also be checked on the backend

### Testing
- **Vitest**
- **Supertest** for backend/API tests
- **React Testing Library** for important frontend behavior

### Development Tools
- Package manager: **npm**
- **ESLint**
- **Prettier**
- `.env` for local secrets
- `.env.example` with variable names only
- Git + GitHub pull requests

## Repository Shape

```text
queens-match/
├── AGENTS.md
├── README.md
├── docs/
├── client/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── features/
│       ├── api/
│       └── routes/
└── server/
    ├── prisma/
    │   └── schema.prisma
    └── src/
        ├── auth/
        ├── users/
        ├── mentors/
        ├── mentoring/
        ├── admin/
        └── middleware/
```

Prefer feature-based folders over many generic abstraction layers.

## API Conventions

- All backend routes start with `/api`
- JSON request/response bodies
- Validate incoming data with Zod
- Return appropriate HTTP status codes
- Use one centralized error handler
- Never trust IDs or roles sent by the frontend
- Get the logged-in user identity from the authenticated session/token

## Time Handling

- Store date/time values in UTC
- Send ISO-8601 timestamps through the API
- Convert to local display time in the UI

## UI Language

- User-facing application text is **Hebrew**
- Main layout uses **RTL**
- Code, variable names, database fields, API routes, and documentation remain in English

## Do Not Add Yet

Unless a current MVP requirement truly needs them, do not add:
- Redux
- TanStack Query
- Docker/Kubernetes
- Redis
- message queues
- WebSockets
- GraphQL
- microservices
- dependency-injection frameworks
- generic repository/service frameworks

Use the simplest tool that solves the current Phase 1 requirement.
