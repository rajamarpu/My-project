-- ============================================================
-- Celebrity Academy — PostgreSQL Schema & Seed Data
-- Run with:  psql -U postgres -d celebrity_academy -f init.sql
-- ============================================================

BEGIN;

-- ============================================================
-- 1. DROP existing tables/idempotent startup
-- ============================================================
DROP TABLE IF EXISTS review_submissions   CASCADE;
DROP TABLE IF EXISTS assessment_submissions CASCADE;
DROP TABLE IF EXISTS assessments          CASCADE;
DROP TABLE IF EXISTS learning_content     CASCADE;
DROP TABLE IF EXISTS tasks                CASCADE;
DROP TABLE IF EXISTS review_assessments   CASCADE;
DROP TABLE IF EXISTS certificates         CASCADE;
DROP TABLE IF EXISTS enrollments          CASCADE;
DROP TABLE IF EXISTS courses              CASCADE;
DROP TABLE IF EXISTS ai_personalities     CASCADE;
DROP TABLE IF EXISTS login_activity       CASCADE;
DROP TABLE IF EXISTS contact_submissions  CASCADE;
DROP TABLE IF EXISTS users                CASCADE;

-- ============================================================
-- 2. USERS
-- ============================================================
CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  full_name       VARCHAR(255)      NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  phone           VARCHAR(50)       NOT NULL DEFAULT '',
  password_hash   VARCHAR(255)      NOT NULL,
  role            VARCHAR(20)       NOT NULL DEFAULT 'learner' CHECK (role IN ('learner','instructor','admin')),
  avatar_url      VARCHAR(512)      NOT NULL DEFAULT '',
  headline        VARCHAR(255)      NOT NULL DEFAULT '',
  bio             TEXT              NOT NULL DEFAULT '',
  location        VARCHAR(255)      NOT NULL DEFAULT '',
  theme           VARCHAR(10)       NOT NULL DEFAULT 'dark' CHECK (theme IN ('light','dark')),
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  product_updates     BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_email ON users (lower(email));

-- ============================================================
-- 3. AI PERSONALITIES
-- ============================================================
CREATE TABLE ai_personalities (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(255)      NOT NULL,
  slug             VARCHAR(255) UNIQUE NOT NULL,
  category         VARCHAR(50)       NOT NULL CHECK (category IN ('Bollywood','Hollywood','Sports','Tech')),
  avatar_url       VARCHAR(512)      NOT NULL,
  intro_animation  VARCHAR(512)      NOT NULL DEFAULT '',
  voice_style      VARCHAR(50)       NOT NULL CHECK (voice_style IN ('energetic','calm','warm','authoritative','intellectual','narrative','sultry','powerful')),
  teaching_tone    VARCHAR(50)       NOT NULL CHECK (teaching_tone IN ('motivational','enthusiastic','friendly','professional','disciplined','thoughtful','storytelling','confident')),
  gesture_style    VARCHAR(50)       NOT NULL CHECK (gesture_style IN ('expressive','dynamic','graceful','elegant','precise','articulate','commanding','inspiring')),
  color_primary    VARCHAR(50)       NOT NULL DEFAULT 'from-cyan-500 to-blue-600',
  color_accent     VARCHAR(50)       NOT NULL DEFAULT 'text-cyan-400',
  color_bg         VARCHAR(50)       NOT NULL DEFAULT 'from-cyan-500/10 via-transparent to-blue-500/5',
  personality_bio  TEXT              NOT NULL DEFAULT '',
  teaching_style   TEXT              NOT NULL DEFAULT '',
  demo_preview_url VARCHAR(512)      NOT NULL DEFAULT '',
  is_active        BOOLEAN           NOT NULL DEFAULT true,
  rating           NUMERIC(3,1)      NOT NULL DEFAULT 0,
  total_courses    INT               NOT NULL DEFAULT 0
);

CREATE INDEX idx_personalities_category ON ai_personalities (category);
CREATE INDEX idx_personalities_active   ON ai_personalities (is_active) WHERE is_active;

-- ============================================================
-- 4. COURSES
-- ============================================================
CREATE TABLE courses (
  id                 SERIAL PRIMARY KEY,
  title              VARCHAR(255)      NOT NULL,
  slug               VARCHAR(255) UNIQUE NOT NULL,
  description        TEXT              NOT NULL,
  short_description  VARCHAR(512)      NOT NULL DEFAULT '',
  instructor_id      INT               NOT NULL REFERENCES ai_personalities(id),
  category           VARCHAR(100)      NOT NULL,
  sub_category       VARCHAR(100),
  level              VARCHAR(20)       NOT NULL DEFAULT 'Beginner' CHECK (level IN ('Beginner','Intermediate','Advanced')),
  price              NUMERIC(10,2)    NOT NULL DEFAULT 0,
  thumbnail_url      VARCHAR(512)      NOT NULL DEFAULT '',
  preview_video_url  VARCHAR(512)      NOT NULL DEFAULT '',
  tags               TEXT[],
  prerequisites      TEXT[],
  learning_outcomes  TEXT[],
  avg_rating         NUMERIC(3,1)     NOT NULL DEFAULT 0,
  rating_count       INT              NOT NULL DEFAULT 0,
  enrollment_count   INT              NOT NULL DEFAULT 0,
  status             VARCHAR(20)      NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured           BOOLEAN          NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_status   ON courses (status);
CREATE INDEX idx_courses_category ON courses (category);
CREATE INDEX idx_courses_instructor ON courses (instructor_id);
CREATE INDEX idx_courses_featured ON courses (featured) WHERE featured;

-- ============================================================
-- 5. LESSONS (1-to-many from COURSES)
-- ============================================================
CREATE TABLE lessons (
  id           SERIAL PRIMARY KEY,
  course_id    INT     NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  description  TEXT    NOT NULL DEFAULT '',
  video_url    VARCHAR(512) NOT NULL DEFAULT '',
  duration_sec INT    NOT NULL DEFAULT 0,
  lesson_order INT    NOT NULL,
  resources    TEXT[] NOT NULL DEFAULT '{}',
  quiz_question TEXT,
  quiz_options  TEXT[] NOT NULL DEFAULT '{}',
  quiz_answer   INT
);
CREATE INDEX idx_lessons_course ON lessons (course_id);

-- ============================================================
-- 6. ENROLLMENTS
-- ============================================================
CREATE TABLE enrollments (
  id                  SERIAL PRIMARY KEY,
  user_id             INT    NOT NULL REFERENCES users(id),
  course_id           INT    NOT NULL REFERENCES courses(id),
  enrolled_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_lesson      INT    NOT NULL DEFAULT 0,
  current_personality INT          REFERENCES ai_personalities(id),
  progress            INT    NOT NULL DEFAULT 0,
  completed_lessons   INT[]  NOT NULL DEFAULT '{}',
  status              VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','dropped')),
  certificate_issued  BOOLEAN NOT NULL DEFAULT false,
  certificate_url     VARCHAR(512) NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_enrollments_user   ON enrollments (user_id);
CREATE INDEX idx_enrollments_course ON enrollments (course_id);

-- ============================================================
-- 7. REVIEWS
-- ============================================================
CREATE TABLE reviews (
  id          SERIAL PRIMARY KEY,
  user_id     INT    NOT NULL REFERENCES users(id),
  course_id   INT    NOT NULL REFERENCES courses(id),
  rating      INT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT   NOT NULL,
  likes       INT    NOT NULL DEFAULT 0,
  verified    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reviews_course ON reviews (course_id, rating DESC);

-- ============================================================
-- 8. CERTIFICATES
-- ============================================================
CREATE TABLE certificates (
  id                SERIAL PRIMARY KEY,
  user_id           INT    NOT NULL REFERENCES users(id),
  course_id         INT    NOT NULL REFERENCES courses(id),
  enrollment_id     INT    NOT NULL REFERENCES enrollments(id),
  certificate_url   VARCHAR(512) NOT NULL,
  issued_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  completion_date   DATE          NOT NULL,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. CONTACT SUBMISSIONS
-- ============================================================
CREATE TABLE contact_submissions (
  id          SERIAL PRIMARY KEY,
  full_name   VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  subject     VARCHAR(255) NOT NULL,
  message     TEXT         NOT NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','closed')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 10. LOGIN ACTIVITY
-- ============================================================
CREATE TABLE login_activity (
  id         SERIAL PRIMARY KEY,
  user_id    INT    NOT NULL REFERENCES users(id),
  email      VARCHAR(255) NOT NULL,
  ip         VARCHAR(45)  NOT NULL DEFAULT '',
  user_agent TEXT         NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_login_activity_user ON login_activity (user_id, created_at DESC);

-- ============================================================
-- 11. ASSESSMENTS
-- ============================================================
CREATE TABLE assessments (
  id                 SERIAL PRIMARY KEY,
  instructor_username VARCHAR(255) NOT NULL,
  course_id          VARCHAR(255) NOT NULL,
  title              VARCHAR(255) NOT NULL,
  prompt             TEXT         NOT NULL,
  due_date           TIMESTAMPTZ,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_assessments_course ON assessments (course_id);

-- ============================================================
-- 12. ASSESSMENT SUBMISSIONS
-- ============================================================
CREATE TABLE assessment_submissions (
  id              SERIAL PRIMARY KEY,
  assessment_id   INT    NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  course_id       VARCHAR(255) NOT NULL,
  username        VARCHAR(255) NOT NULL,
  answer_text     TEXT   NOT NULL,
  note_file_name  VARCHAR(255),
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_submission_unique ON assessment_submissions (username, course_id, assessment_id);

Commit;

-- ============================================================
-- 13. SEED DATA
-- ============================================================

-- Helper: bcrypt hash of "password" ($2b$12$LQ…)
-- 'password' → '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA/7.J6LlZy'

INSERT INTO ai_personalities
  (name, slug, category, avatar_url, voice_style, teaching_tone, gesture_style, personality_bio, teaching_style, demo_preview_url, total_courses)
VALUES
  ('Shah Rukh Khan', 'srk', 'Bollywood',
   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
   'energetic', 'motivational', 'expressive',
   'The King of Bollywood brings his charismatic energy.',
   'Storytelling approach with real-life examples',
   '', 3),

  ('Ranveer Singh', 'ranveer', 'Bollywood',
   'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
   'energetic', 'enthusiastic', 'dynamic',
   'Ranveer''s boundless energy makes learning fun.',
   'High-energy delivery with interactive elements',
   '', 2),

  ('Virat Kohli',  'virat', 'Sports',
   'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80',
   'powerful', 'disciplined', 'commanding',
   'Discipline, focus, and relentless drive.',
   'Goal-oriented and structured learning path',
   '', 2),

  ('Emma Watson',  'emma', 'Hollywood',
   'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
   'warm', 'thoughtful', 'graceful',
   'Thoughtful advocacy meets world-class education values.',
   'Reflective and discussion-led approach',
   '', 2),

  ('Sundar Pichai', 'pichai', 'Tech',
   'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
   'intellectual', 'professional', 'articulate',
   'From Chennai CEO to AI leadership — learn from the very best.',
   'Clear explanations with progressive difficulty',
   '', 2);

INSERT INTO users
  (id, full_name, email, phone, password_hash, role, created_at, updated_at)
VALUES
  (1, 'Demo Learner',     'learner@example.com',     '1234567890',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA/7.J6LlZy', 'learner',    NOW(), NOW()),
  (2, 'Demo Instructor',  'instructor@example.com',  '0987654321',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA/7.J6LlZy', 'instructor', NOW(), NOW()),
  (3, 'Platform Admin',   'admin@example.com',       '9999999999',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA/7.J6LlZy', 'admin',      NOW(), NOW());

INSERT INTO courses
  (title, slug, description, short_description, instructor_id, category, level, price, status, featured, enrollment_count, tags)
VALUES
  ('Python for Cricket Data Analytics', 'python-cricket-analytics',
   'Learn Python fundamentals while building sports analytics tools',
   'Python + cricket data', 3, 'Programming', 'Beginner', 0.00, 'published', true, 12543, ARRAY['python','data-science','cricket']),

  ('JavaScript Fullstack Game Apps', 'javascript-game-apps',
   'Create interactive fan engagement apps',
   'JavaScript + game apps', 2, 'Web Development', 'Intermediate', 0.00, 'published', true, 6789, ARRAY['javascript','react','nodejs']),

  ('Acting Masterclass', 'acting-masterclass',
   'Learn character development and emotional range from the king of Bollywood',
   'Acting techniques', 1, 'Arts', 'Beginner', 49.99, 'published', false, 4321, ARRAY['bollywood','acting','performance']),

  ('Leadership on the Field', 'leadership-field',
   'Lessons in resilience, teamwork, and leadership from a cricket legend',
   'Sports leadership', 3, 'Leadership', 'Beginner', 29.99, 'published', false, 2100, ARRAY['sports','leadership','motivation']),

  ('Node.js Backend for LMS', 'nodejs-backend-lms',
   'Build production-grade REST APIs and learning management backends',
   'Node.js + Express + PostgreSQL', 4, 'Web Development', 'Advanced', 79.99, 'published', true, 3100, ARRAY['nodejs','express','postgresql','api']),

  ('UI Design Fundamentals', 'ui-design-fundamentals',
   'Master design principles, color theory, and component architecture',
   'UI / UX design', 5, 'Design', 'Beginner', 39.99, 'published', false, 5600, ARRAY['design','ui','ux','figma']);
