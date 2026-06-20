ALTER TABLE "payments"
  ADD COLUMN "productType" TEXT NOT NULL DEFAULT 'COURSE',
  ADD COLUMN "productRef" TEXT,
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "receiptNo" TEXT,
  ADD COLUMN "refundedCents" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "payments_idempotencyKey_key" ON "payments"("idempotencyKey");
CREATE UNIQUE INDEX "payments_receiptNo_key" ON "payments"("receiptNo");

CREATE TABLE "saved_courses" (
  "id" TEXT NOT NULL,
  "userId" INTEGER NOT NULL,
  "courseId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "saved_courses_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "saved_courses_userId_courseId_key" ON "saved_courses"("userId", "courseId");
CREATE INDEX "saved_courses_userId_createdAt_idx" ON "saved_courses"("userId", "createdAt");
ALTER TABLE "saved_courses" ADD CONSTRAINT "saved_courses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_courses" ADD CONSTRAINT "saved_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "user_preferences" (
  "id" TEXT NOT NULL,
  "userId" INTEGER NOT NULL,
  "settings" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "platform_settings" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "updatedById" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "platform_settings_key_key" ON "platform_settings"("key");

CREATE TABLE "live_sessions" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "courseId" TEXT,
  "instructorId" INTEGER NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "meetingUrl" TEXT,
  "recordingUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "live_sessions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "live_sessions_startsAt_status_idx" ON "live_sessions"("startsAt", "status");
CREATE INDEX "live_sessions_instructorId_startsAt_idx" ON "live_sessions"("instructorId", "startsAt");
CREATE INDEX "live_sessions_courseId_idx" ON "live_sessions"("courseId");
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "community_topics" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "createdById" INTEGER NOT NULL,
  "isLocked" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "community_topics_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "community_topics_slug_key" ON "community_topics"("slug");
CREATE INDEX "community_topics_createdAt_idx" ON "community_topics"("createdAt");
ALTER TABLE "community_topics" ADD CONSTRAINT "community_topics_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "community_posts" (
  "id" TEXT NOT NULL,
  "topicId" TEXT NOT NULL,
  "authorId" INTEGER NOT NULL,
  "parentId" TEXT,
  "body" TEXT NOT NULL,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "community_posts_topicId_createdAt_idx" ON "community_posts"("topicId", "createdAt");
CREATE INDEX "community_posts_parentId_idx" ON "community_posts"("parentId");
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "community_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "community_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "community_reports" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "reporterId" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_reports_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "community_reports_postId_reporterId_key" ON "community_reports"("postId", "reporterId");
CREATE INDEX "community_reports_status_createdAt_idx" ON "community_reports"("status", "createdAt");
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_postId_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
