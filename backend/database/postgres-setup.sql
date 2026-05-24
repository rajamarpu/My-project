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
    role VARCHAR(20) NOT NULL DEFAULT 'learner' CHECK (role IN ('learner','instructor','admin')),
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

-- Insert default admin user
INSERT INTO users (full_name, email, phone, password_hash, role, headline) VALUES 
('Platform Admin', 'admin@example.com', '9999999999', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA/7.J6LlZy', 'admin', 'System Administrator')
ON CONFLICT DO NOTHING;

-- Insert demo learner
INSERT INTO users (full_name, email, phone, password_hash, role, headline) VALUES 
('Demo Learner', 'learner@example.com', '1234567890', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA/7.J6LlZy', 'learner', 'Student')
ON CONFLICT DO NOTHING;