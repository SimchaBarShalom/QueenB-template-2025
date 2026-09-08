# QueenB - Full Stack Task Management Application
A template for building a full-stack web application using modern technologies - fork this repository to get started quickly.

Built with Node.js, Express, React, Material UI, PostgreSQL, and Prisma.

## 🚀 Features

- **Modern UI**: Beautiful, responsive interface built with Material UI
- **RESTful API**: Well-structured backend API with Express.js
- **PostgreSQL data layer**: Prisma schema, migration, and seed data
- **Basic authentication**: Registration and login with hashed passwords
- **JWT sessions**: Login/register return a bearer token, and protected routes can restore the current user through `/api/auth/me`
- **Admin MVP**: Admin-only dashboard, user management, meeting operations, calendar view, and operational alerts
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **CORS** - Cross-origin resource sharing
- **Prisma** - PostgreSQL ORM and migration tooling
- **bcryptjs** - Password hashing
- **jsonwebtoken** - API session tokens
- **Nodemon** - Development auto-restart

### Frontend

- **React 18** - UI library
- **Material UI (MUI)** - Component library
- **Axios** - HTTP client
- **React Scripts** - Build tools
- **FullCalendar** - Admin month calendar

## 📦 Project Structure

```
QueenB/
├── server/                 # Backend application
│   ├── routes/            # API route handlers
│   ├── prisma/            # Prisma schema, migrations, and seed script
│   ├── index.js           # Server entry point
│   ├── package.json       # Server dependencies
│   └── .env.example       # Environment variables template
├── client/                # Frontend application
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.js         # Main application component
│   │   └── index.js       # React entry point
│   └── package.json       # Client dependencies
├── package.json           # Root package.json with scripts
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager
- PostgreSQL database

### Installation

1. **Fork the template repository to your own user**
If you are working as a team, you can choose one member to fork the template repository to their own user, 
and then share the repository with the rest of the team.


2. **Clone or navigate to the project directory**

   ```bash
   git clone **copied git url**
   ```

   ```bash
   cd QueenB
   ```

2. **Install root dependencies**

   ```bash
   npm install
   ```

3. **Install server and client dependencies**

   ```bash
   npm run install-all
   ```

   OR:

   - open terminal and run:

   ```bash
   cd server
   npm install
   ```

   - open another terminal

   ```bash
   cd client
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cd server
   cp .env.example .env
   # Edit DATABASE_URL in .env for your local PostgreSQL database
   # Edit JWT_SECRET to a long random string
   cd ..
   ```

5. **Set up the database**

   ```bash
   cd server
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   cd ..
   ```

   Seed users:

   All seeded demo users use `Password123!`.

   - Admin: `admin@queenb.org`
   - Mentor: `mentor@queenb.org`
   - Mentee: `mentee@queenb.org`
   - Inactive mentor demo: `inactive-mentor@queenb.org`
   - Admin alert demo mentee: `mentee-alerts@queenb.org`

   The expanded demo seed also creates accounts `demo-mentor-1@queenb.org` through
   `demo-mentor-20@queenb.org` and `demo-mentee-1@queenb.org` through
   `demo-mentee-40@queenb.org`. They all use the same development-only password
   `Password123!`. The seed is additive and upsert-only; running it again does not
   reset or delete existing records.

### Running the Application

#### Development Mode (Recommended)

#### Running Separately

**Start the backend server:**

```bash
npm run server
```

**Start the frontend client (in a new terminal):**

```bash
npm run client
```

#### Running Concurrently

Run both client and server concurrently:

```bash
npm run dev
```

This will start:

- Backend server on http://localhost:5000
- Frontend client on http://localhost:3000 - you can access the application in your browser at this URL.

### Building for Production

1. **Build the React client:**

   ```bash
   npm run build
   ```

2. **Start the production server:**
   ```bash
   npm start
   ```



### Health Check

- `GET /api/health` - Server health check

### Auth Endpoints

- `POST /api/auth/register` - Register a Mentee or Mentor user
- `POST /api/auth/login` - Log in with email and password
- `GET /api/auth/me` - Restore the current user from a bearer token
- `GET /api/admin/*` - Admin-only management APIs


## 🔧 Development

### Available Scripts

- `npm run dev` - Run both client and server in development mode
- `npm run server` - Run only the backend server
- `npm run client` - Run only the frontend client
- `npm run install-all` - Install dependencies for both client and server
- `npm run build` - Build the React client for production
- `npm start` - Start the production server
- `cd server && npm run prisma:generate` - Generate Prisma Client
- `cd server && npm run prisma:migrate` - Run database migrations
- `cd server && npm run prisma:seed` - Seed Admin, Mentor, and Mentee users

### Key Features

- **Responsive Design**: The application works on all device sizes
- **Modern UI**: Material UI components provide a professional look
- **Error Handling**: Comprehensive error handling on both frontend and backend
- **Loading States**: User-friendly loading indicators
- **Form Validation**: Client and server-side validation
- **Success Feedback**: Clear success and error messages


## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use**: If ports 3000 or 5000 are in use, you can change them in the package.json scripts or .env file

2. **Installation issues**: Delete `node_modules` folders and run `npm run install-all` again

3. **API connection issues**: Ensure the backend server is running on port 5000 and the proxy is configured correctly in the client package.json

### Support

If you encounter any issues, please check the console logs for detailed error messages or create an issue in the repository.

---

Built with ❤️ using React, Material UI, and Node.js
