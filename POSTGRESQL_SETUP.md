# PostgreSQL Setup for UptoSkills

## After Installing PostgreSQL:

1. **Start PostgreSQL service**
   - Windows: Services → PostgreSQL → Start
   - macOS: `brew services start postgresql`
   - Linux: `sudo systemctl start postgresql`

2. **Create the database and user**

   Open Terminal/Command Prompt and run:
   ```bash
   # Connect to PostgreSQL as postgres user
   psql -U postgres

   # Inside psql, create database and user
   CREATE USER uptoskills_user WITH PASSWORD 'uptoskills_pass';
   CREATE DATABASE uptoskills OWNER uptoskills_user;
   GRANT ALL PRIVILEGES ON DATABASE uptoskills TO uptoskills_user;
   \q
   ```

3. **Run the setup script**
   ```bash
   psql -U uptoskills_user -d uptoskills -f backend/database/postgres-setup.sql
   ```

4. **Update .env**
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=uptoskills
   DB_USER=uptoskills_user
   DB_PASSWORD=uptoskills_pass
   USE_MONGO=false
   ```

5. **Start the server**
   ```bash
   npm run backend:express
   ```

## Default Credentials
- Admin: `admin@example.com` / `Admin@12345`
- Learner: `learner@example.com` / `password`