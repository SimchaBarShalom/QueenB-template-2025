# Queens Match Git Workflow

## Branch Strategy

Use `main` as the only long-lived branch.

Do not create one branch per developer for the whole project. Every feature or fix should have its own short-lived branch.

Recommended branch names:

```text
feature/mentor-profile
feature/mentor-directory
feature/admin-users-list
feature/create-mentoring-request
fix/auth-me-refresh
db/add-mentor-profile
docs/api-contracts
```

## Base Foundation

The current foundation branch is:

```text
base-implementation
```

Before Phase 2 starts:

1. Open a pull request from `base-implementation` to `main`.
2. At least one teammate reviews it.
3. Each teammate verifies the setup locally.
4. Merge into `main`.
5. Every teammate pulls the same latest `main`.

## Feature Workflow

For every feature:

```bash
git checkout main
git pull
git checkout -b feature/short-feature-name
```

When the feature is ready:

```bash
git status
npm run build
git add -A
git commit -m "Describe the feature"
git push -u origin feature/short-feature-name
```

Then open a pull request into `main`.

## Pull Request Rules

Each pull request should:

- Solve one feature or one small bug group.
- Include backend and frontend changes only when both are needed for that feature.
- Include Prisma schema, migration, seed, and API contract updates when the database/API changes.
- Be reviewed by at least one teammate before merge.
- Be merged only after the app still runs locally.

## Shared File Rules

High-conflict files need extra care:

- `server/prisma/schema.prisma`: discuss schema changes before coding them.
- `server/prisma/migrations`: never edit a migration after it has been merged.
- `package-lock.json`: never hand-edit; regenerate with npm.
- `client/src/App.js`: only add route imports/mounts needed for the feature.
- `server/index.js`: only add route mounts or shared middleware needed for the feature.
- `client/src/theme.js` and `client/src/index.css`: avoid feature-specific styling here.

## Prisma Workflow

When a feature needs a database change:

1. Pull latest `main`.
2. Create a small `db/<change-name>` branch if the change affects multiple features.
3. Update `server/prisma/schema.prisma`.
4. Create a migration:

   ```bash
   cd server
   npm run prisma:migrate
   ```

5. Update seed data if needed.
6. Update `docs/api-contracts.md` if API shapes changed.
7. Merge the database change before dependent feature branches go too far.

## Environment Files

Commit:

```text
server/.env.example
```

Do not commit:

```text
server/.env
client/.env
```

Each teammate should configure her own local `.env`.
