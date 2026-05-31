CREATE TYPE "SubmissionStatus" AS ENUM ('PASSED', 'FAILED', 'PENDING_EVALUATION');

CREATE TABLE "assessment_submissions" (
    "id" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "courseId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "assignmentName" TEXT NOT NULL,
    "studentAnswers" JSONB NOT NULL,
    "questionReviews" JSONB NOT NULL,
    "totalMarks" INTEGER NOT NULL DEFAULT 0,
    "obtainedMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'FAILED',
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "completionTimeSec" INTEGER,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluatedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "assessment_submissions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "assessment_submissions_studentId_submittedAt_idx" ON "assessment_submissions"("studentId", "submittedAt");
CREATE INDEX "assessment_submissions_courseId_submittedAt_idx" ON "assessment_submissions"("courseId", "submittedAt");
CREATE INDEX "assessment_submissions_assignmentId_idx" ON "assessment_submissions"("assignmentId");
CREATE INDEX "assessment_submissions_status_idx" ON "assessment_submissions"("status");

ALTER TABLE "assessment_submissions" ADD CONSTRAINT "assessment_submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assessment_submissions" ADD CONSTRAINT "assessment_submissions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
