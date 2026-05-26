-- SQL Database Schema for Celebrity Academy
-- Run this against PostgreSQL or SQLite

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) DEFAULT '',
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'learner' CHECK (role IN ('learner', 'admin')),
    avatar_url VARCHAR(500) DEFAULT '',
    headline VARCHAR(200) DEFAULT '',
    bio TEXT DEFAULT '',
    location VARCHAR(100) DEFAULT '',
    theme VARCHAR(10) DEFAULT 'dark' CHECK (theme IN ('light', 'dark')),
    email_notifications BOOLEAN DEFAULT TRUE,
    product_updates BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS ai_personalities (
    id TEXT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    archetype VARCHAR(160) NOT NULL,
    "avatarUrl" VARCHAR(500) DEFAULT '',
    "voiceStyle" TEXT NOT NULL,
    "teachingStyle" TEXT NOT NULL,
    traits TEXT[] DEFAULT ARRAY[]::TEXT[],
    "promptTemplate" TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(220) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(80) NOT NULL,
    level VARCHAR(20) DEFAULT 'BEGINNER' CHECK (level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
    "thumbnailUrl" VARCHAR(500) DEFAULT '',
    "videoPreviewUrl" VARCHAR(500) DEFAULT '',
    "isPublished" BOOLEAN DEFAULT TRUE,
    "createdById" INTEGER REFERENCES users(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    "courseId" TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(20) DEFAULT 'VIDEO' CHECK (type IN ('VIDEO', 'QUIZ', 'ARTICLE')),
    "videoUrl" VARCHAR(500),
    "durationMin" INTEGER DEFAULT 0,
    "sortOrder" INTEGER DEFAULT 0,
    "quizJson" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enrollments (
    id TEXT PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "courseId" TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    "personalityId" TEXT REFERENCES ai_personalities(id) ON DELETE SET NULL,
    "completionPct" INTEGER DEFAULT 0,
    "hoursStudied" DOUBLE PRECISION DEFAULT 0,
    "quizAverage" INTEGER DEFAULT 0,
    "streakDays" INTEGER DEFAULT 0,
    "enrolledAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP,
    UNIQUE("userId", "courseId")
);

CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses("isPublished");
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons("courseId", "sortOrder");
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments("courseId");
CREATE INDEX IF NOT EXISTS idx_enrollments_personality ON enrollments("personalityId");

-- Login activity audit table
CREATE TABLE IF NOT EXISTS login_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learners portal specific table
CREATE TABLE IF NOT EXISTS learner_progress (
    id SERIAL PRIMARY KEY,
    learner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER,
    progress_percent INTEGER DEFAULT 0,
    completed_lessons JSONB DEFAULT '[]',
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin portal specific table
CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User records are managed by Prisma seed scripts and live registration.
-- This SQL schema intentionally does not insert sample accounts.
