-- SQL Database Schema for Celebrity Academy
-- Run this against PostgreSQL or SQLite

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('learner', 'instructor', 'admin')),
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

-- Insert default admin user (password: Admin@12345)
-- Password hash generated with bcrypt
INSERT INTO users (full_name, email, phone, password_hash, role, headline)
VALUES (
    'Platform Admin',
    'admin@example.com',
    '9999999999',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA/7.J6LlZy',
    'admin',
    'System Administrator'
) ON CONFLICT (email) DO NOTHING;

-- Insert demo learner
INSERT INTO users (full_name, email, phone, password_hash, role, headline)
VALUES (
    'Demo Learner',
    'learner@example.com',
    '1234567890',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA/7.J6LlZy',
    'learner',
    'Student'
) ON CONFLICT (email) DO NOTHING;