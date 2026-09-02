# Queens Match – Base MVP

## Goal

Build a simple working foundation for the Queens Match system.

The purpose of this stage is to create a shared base that works end-to-end and can later be extended separately with Mentee, Mentor, and Admin features.

This stage should focus only on the common project infrastructure.

Business logic and advanced authorization are not part of the Base MVP.

---

## Base MVP Scope

### 1. Project Setup

The existing QueenB template should run successfully with both frontend and backend.

The project should include:

* React client.
* Express server.
* Required project dependencies.
* Environment variables configuration.
* Working connection between client and server.
* Basic API endpoint for verifying that the server is running.

---

### 2. Database Setup

Set up PostgreSQL with Prisma.

The Base MVP should include:

* Prisma configuration.
* Database connection.
* Initial Prisma schema.
* Database migration.
* Basic seed script.

The database structure should provide a stable foundation for the features that will be developed later.

---

### 3. Users And Roles

Create the basic user structure.

Each user should contain the common information required by the system.

The system should support the following roles:

* `MENTEE`
* `MENTOR`
* `ADMIN`

At this stage, the role should be stored in the database so future features can distinguish between the three user types.

Advanced role-based authorization is not required yet.

---

### 4. Basic Authentication

Implement the basic user flow required to enter the system.

The Base MVP should include:

* User registration.
* User login.
* Password storage using hashing.
* Basic user data validation.
* Ability to identify whether the registered user is a Mentee or Mentor.

Advanced authentication middleware and protected routes are not part of this stage.

---

### 5. Seed Data

Create basic development data so the system can be tested easily.

Seed data should include at least:

* One Admin user.
* One Mentor user.
* One Mentee user.

The goal of the seed is to allow all future feature branches to work with the same initial data.

---

### 6. Shared Frontend Structure

Create the common UI structure that will be shared by all future features.

The Base MVP should include:

* Hebrew RTL support.
* Shared application theme.
* Main layout.
* Header / Navbar.
* QueenB branding.
* Basic responsive layout.
* Basic loading state.
* Basic error state.

---

### 7. Home Page

Create a basic landing page for Queens Match.

The page should:

* Introduce the Queens Match system.
* Provide navigation to Login.
* Provide navigation to Mentee registration.
* Provide navigation to Mentor registration.

The Home Page does not need advanced functionality at this stage.

---

### 8. Basic Pages

The Base MVP should provide the basic shared pages needed before feature development begins.

Required pages:

* Home Page.
* Login Page.
* Mentee Registration Page.
* Mentor Registration Page.
* Basic Profile Page.

Basic placeholder pages may also be created for:

* Mentee area.
* Mentor area.
* Admin area.

These pages do not need business functionality yet.

---

## Base MVP User Flow

At the end of this stage:

1. The client and server run successfully.
2. The application connects successfully to the database.
3. A user can register.
4. A user can log in.
5. A user is stored in the database with the correct role.
6. Seed users exist for Mentee, Mentor, and Admin.
7. The common application layout and RTL design work.
8. The basic pages are accessible.
9. The project is ready to be divided into Mentee, Mentor, and Admin feature development.

---

## Out Of Scope For Base MVP

The following features should **not** be implemented during the Base MVP:

* Authentication Middleware.
* Role Middleware.
* Advanced protected routes.
* Mentor browsing.
* Mentor matching.
* Mentoring requests.
* Request approval or rejection.
* Offering meeting slots.
* Meeting scheduling.
* Rescheduling.
* Attendance confirmation.
* Feedback.
* Mentor capacity rules.
* Admin Dashboard.
* Admin meeting management.
* Admin filters.
* Calendar view.
* Alerts.
* WhatsApp integration.
* Email notifications.
* Google Calendar integration.
* Advanced analytics.

These features will be added after the Base MVP is completed.

---

## After The Base MVP

Once the Base MVP is stable, development can be divided into three main areas:

### Mentee

Mentee-specific pages and mentoring request flow.

### Mentor

Mentor profile, incoming requests, availability, and meeting management.

### Admin

User management, meeting monitoring, filters, alerts, and administrative views.

---

## Definition Of Done

The Base MVP is complete when:

* [ ] Client runs successfully.
* [ ] Server runs successfully.
* [ ] Client communicates with server.
* [ ] PostgreSQL database is connected.
* [ ] Prisma is configured.
* [ ] Initial database schema exists.
* [ ] Database migration works.
* [ ] Seed script works.
* [ ] Mentee, Mentor, and Admin users exist in seed data.
* [ ] Registration works.
* [ ] Login works.
* [ ] User role is stored in the database.
* [ ] Home Page exists.
* [ ] Login Page exists.
* [ ] Mentee Registration Page exists.
* [ ] Mentor Registration Page exists.
* [ ] Basic Profile Page exists.
* [ ] Shared RTL layout exists.
* [ ] Shared Navbar/Header exists.
* [ ] Basic loading and error states exist.
* [ ] No Mentee/Mentor/Admin business features are implemented yet.
* [ ] The project is ready for feature development.
