CREATE TABLE "assessment_retake_grants" (
    "id" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "courseId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "extraAttempts" INTEGER NOT NULL DEFAULT 1,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_retake_grants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "assessment_retake_grants_studentId_courseId_assignmentId_key" ON "assessment_retake_grants"("studentId", "courseId", "assignmentId");
CREATE INDEX "assessment_retake_grants_courseId_assignmentId_idx" ON "assessment_retake_grants"("courseId", "assignmentId");
CREATE INDEX "assessment_retake_grants_createdById_idx" ON "assessment_retake_grants"("createdById");

ALTER TABLE "assessment_retake_grants" ADD CONSTRAINT "assessment_retake_grants_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assessment_retake_grants" ADD CONSTRAINT "assessment_retake_grants_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assessment_retake_grants" ADD CONSTRAINT "assessment_retake_grants_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
