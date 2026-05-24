# PostgreSQL Database Configuration

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=uptoskills
DB_USER=postgres
DB_PASSWORD=your_password

# Alternative: Use DATABASE_URL for full connection string
# DATABASE_URL=postgresql://postgres:password@localhost:5432/uptoskills

# JWT Configuration
JWT_SECRET=your-jwt-secret-change-in-production
JWT_EXPIRES_IN=7d

# Admin Portal
ADMIN_PORT=5001
ADMIN_ORIGIN=http://localhost:5175

# Learner Portal
LEARNER_PORT=5002
LEARNER_ORIGIN=http://localhost:5176

# Main API
API_PORT=5000
CLIENT_ORIGINS=http://localhost:5174,http://localhost:5175,http://localhost:5176

# Seed users (optional)
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=Admin@12345
```

## Quick Start with Docker (Recommended)

If you have Docker installed, run PostgreSQL easily:

```bash
docker run --name uptoskills-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=uptoskills \
  -p 5432:5432 \
  -d postgres:16
```

## Manual PostgreSQL Setup

1. Install PostgreSQL from https://www.postgresql.org/download/
2. Create a database and user:
   ```sql
   CREATE DATABASE uptoskills;
   CREATE USER postgres WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE uptoskills TO postgres;
   ```

## Database Schema

The system automatically creates the following tables:

### users
- Stores all user accounts (learners, instructors, admins)
- Email is unique (case-insensitive)
- Passwords are hashed with bcrypt

### login_activity / login_activities
- Tracks login history for security
- Used by both portals

### learner_progress
- Stores course progress for learners
- Tracks completed lessons and percentage

### contact_submissions
- Stores contact form submissions

## Running the Application

### Terminal 1 - Main Backend
```bash
npm run backend
```

### Terminal 2 - Admin Portal Backend
```bash
npm run backend:admin
```

### Terminal 3 - Learner Portal Backend
```bash
npm run backend:learner
```

### Terminal 4 - Admin Portal Frontend
```bash
npm run dev:admin
```

### Terminal 5 - Learner Portal Frontend
```bash
npm run dev:learner
```

## Demo Accounts

After running `npm run db:check` or `npm run backend:admin`, two demo accounts are created:

| Role | Email | Password |
|------|-------|----------|
| Learner | learner@example.com | password123 |
| Admin | admin@example.com | Admin@12345 |