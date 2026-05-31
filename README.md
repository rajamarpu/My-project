# UptoSkills AI LMS

Premium AI learning platform built with React, Vite, Express, Prisma, and PostgreSQL.

Learning Management System repository for UptoSkills.

## Stack

- Frontend: React, Vite, Tailwind CSS, Redux Toolkit, Framer Motion
- Backend: Node.js, Express, Prisma ORM
- Database: PostgreSQL only
- Auth: Email/password JWT, OTP reset flow, Google OAuth, GitHub OAuth

## Local URLs

- Frontend: http://localhost:5173
- Admin frontend: http://localhost:5174
- Backend: http://localhost:5000
- Health check: http://localhost:5000/api/health

## Start

```bash
npm install
npm.cmd run backend
npm.cmd run dev
```

PowerShell may block `npm.ps1`, so use `npm.cmd` on Windows.

## Environment

Use `backend/.env`:

```env
API_PORT=5000
API_BASE_URL=http://localhost:5000
APP_BASE_URL=http://localhost:5173
CLIENT_ORIGINS=http://localhost:5173,http://localhost:5174
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/uptoskills?schema=public"
JWT_SECRET=replace-this-with-a-long-random-secret
JWT_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=http://localhost:5000/api/auth/github/callback
```

## Database

All application data is stored through Prisma in PostgreSQL. Legacy JSON, MongoDB, and SQLite server files were removed.

```bash
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
npm.cmd run prisma:seed
```

The Prisma schema includes production LMS models for users, categories, courses, lessons, enrollments, progress, payments, certificates, notifications, sessions, activity logs, chat messages, AI personalities, and analytics events. Analytics counters start at zero and are derived from real events such as registration, login, enrollment, watch time, completion, payment, and certificate issuance.

If an existing local database was created before migrations were tracked, Prisma may report drift. To preserve local data while testing schema changes, use:

```bash
cd backend
npx prisma db push
```

To rebuild the development database from migrations, run `npx prisma migrate reset` from `backend`; this drops local data.

## Build

```bash
npm.cmd run build
```
