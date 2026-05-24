# Dual Portal Setup - UptoSkills

This project supports two separate SQL database portals:
- **Admin Portal**: http://localhost:5175 (API: http://localhost:5001)
- **Learner Portal**: http://localhost:5176 (API: http://localhost:5002)

## Database

### SQLite (Default - No external database required)
The system uses SQLite by default (`backend/data/uptoskills.db`). No PostgreSQL installation needed.

### PostgreSQL Schema (Optional)
SQL schema for PostgreSQL is available in `backend/database/sql.schema.sql`.

### Default Credentials

**Admin Portal:**
- Email: `admin@example.com`
- Password: `Admin@12345`

**Learner Portal:**
- Email: `learner@example.com`
- Password: `password`

## Running the Portals

### Quick Start (SQLite - Recommended)
```bash
# Terminal 1: Start Admin Portal API
npm run backend:admin

# Terminal 2: Start Learner Portal API
npm run backend:learner
```

### With PostgreSQL (Optional)
1. Create database:
```sql
CREATE DATABASE uptoskills;
```

2. Set environment variables:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=uptoskills
DB_USER=your_user
DB_PASSWORD=your_password
USE_MONGO=true
```

3. Run schema:
```bash
psql -d uptoskills -f backend/database/sql.schema.sql
```

## API Endpoints

### Admin Portal (Port 5001)
- `POST /api/auth/login` - Admin/Instructor login
- `GET /api/auth/me` - Get current admin profile
- `GET /api/admin/learners` - List all learners
- `GET /api/admin/instructors` - List all instructors
- `POST /api/admin/users` - Create new instructor

### Learner Portal (Port 5002)
- `POST /api/auth/register` - Register new learner
- `POST /api/auth/login` - Learner login
- `GET /api/auth/me` - Get current learner profile
- `POST /api/learner/progress` - Update course progress
- `GET /api/learner/dashboard` - Get learner dashboard

## Architecture

```
frontend (port 5174) ───→ API (port 5000)
      │
      ├─── Admin Portal (port 5175) ───→ Admin API (port 5001)
      │
      └─── Learner Portal (port 5176) ───→ Learner API (port 5002)
```

Both portals share the same SQLite database (`backend/data/uptoskills.db`), ensuring consistent user data across portals while providing role-specific endpoints.