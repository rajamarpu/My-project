-- PostgreSQL Setup Script for UptoSkills
-- Run this after installing PostgreSQL

-- Create the database
CREATE DATABASE uptoskills;

-- Connect to the database
\c uptoskills

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL DEFAULT '',
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'learner' CHECK (role IN ('learner','admin')),
    avatar_url VARCHAR(512) NOT NULL DEFAULT '',
    headline VARCHAR(255) NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    location VARCHAR(255) NOT NULL DEFAULT '',
    theme VARCHAR(10) NOT NULL DEFAULT 'dark' CHECK (theme IN ('light','dark')),
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    product_updates BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique index on email (case insensitive)
CREATE UNIQUE INDEX idx_users_email_lower ON users (lower(email));

-- Create login activity table
CREATE TABLE login_activity (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    ip VARCHAR(45) NOT NULL DEFAULT '',
    user_agent TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on login activity
CREATE INDEX idx_login_activity_user ON login_activity (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_personalities (
    id TEXT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    archetype VARCHAR(160) NOT NULL,
    "avatarUrl" VARCHAR(512) DEFAULT '',
    "voiceStyle" TEXT NOT NULL,
    "teachingStyle" TEXT NOT NULL,
    traits TEXT[] DEFAULT ARRAY[]::TEXT[],
    "promptTemplate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(220) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(80) NOT NULL,
    level VARCHAR(20) NOT NULL DEFAULT 'BEGINNER' CHECK (level IN ('BEGINNER','INTERMEDIATE','ADVANCED')),
    "thumbnailUrl" VARCHAR(512) DEFAULT '',
    "videoPreviewUrl" VARCHAR(512) DEFAULT '',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdById" INTEGER REFERENCES users(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    "courseId" TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'VIDEO' CHECK (type IN ('VIDEO','QUIZ','ARTICLE')),
    "videoUrl" VARCHAR(512),
    "durationMin" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "quizJson" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enrollments (
    id TEXT PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "courseId" TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    "personalityId" TEXT REFERENCES ai_personalities(id) ON DELETE SET NULL,
    "completionPct" INTEGER NOT NULL DEFAULT 0,
    "hoursStudied" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quizAverage" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "enrolledAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "completedAt" TIMESTAMPTZ,
    UNIQUE("userId", "courseId")
);

CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses("isPublished");
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons("courseId", "sortOrder");
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments("courseId");
CREATE INDEX IF NOT EXISTS idx_enrollments_personality ON enrollments("personalityId");

-- Insert default admin user
INSERT INTO users (full_name, email, phone, password_hash, role, headline) VALUES 
('Platform Admin', 'admin@example.com', '9999999999', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA/7.J6LlZy', 'admin', 'System Administrator')
ON CONFLICT DO NOTHING;

-- Insert demo learner
INSERT INTO users (full_name, email, phone, password_hash, role, headline) VALUES 
('Demo Learner', 'learner@example.com', '1234567890', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA/7.J6LlZy', 'learner', 'Student')
ON CONFLICT DO NOTHING;
