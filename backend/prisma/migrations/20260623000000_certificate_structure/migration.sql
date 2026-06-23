-- Add structured certificate storage
ALTER TABLE "certificates"
  ADD COLUMN "verificationCode" TEXT,
  ADD COLUMN "completionDate" TIMESTAMP(3),
  ADD COLUMN "issuedById" INTEGER,
  ADD COLUMN "learnerSnapshot" JSONB,
  ADD COLUMN "courseSnapshot" JSONB,
  ADD COLUMN "issueMetadata" JSONB;

-- Backfill a stable verification code for existing certificates
UPDATE "certificates"
SET "verificationCode" = 'VER-' || TO_CHAR(COALESCE("issuedAt", NOW()), 'YYYY') || '-' || UPPER(REPLACE("id", '-', ''))
WHERE "verificationCode" IS NULL OR "verificationCode" = '';

-- Preserve existing certificate context as structured snapshots
UPDATE "certificates" c
SET
  "learnerSnapshot" = jsonb_build_object(
    'id', u.id,
    'name', u."full_name",
    'email', u.email,
    'phone', u.phone,
    'avatarUrl', u.avatar_url
  ),
  "courseSnapshot" = jsonb_build_object(
    'id', co.id,
    'title', co.title,
    'description', co.description,
    'category', co.category,
    'level', co.level,
    'instructor', CASE
      WHEN co."createdById" IS NULL THEN NULL
      ELSE jsonb_build_object(
        'id', cu.id,
        'name', cu."full_name",
        'email', cu.email,
        'expertise', cu.expertise
      )
    END
  ),
  "issueMetadata" = jsonb_build_object(
    'source', 'legacy-migration',
    'migratedAt', to_jsonb(NOW()),
    'legacyIssuedAt', to_jsonb(c."issuedAt")
  )
FROM "users" u
JOIN "courses" co ON co.id = c."courseId"
LEFT JOIN "users" cu ON cu.id = co."createdById"
WHERE u.id = c."userId";

ALTER TABLE "certificates"
  ALTER COLUMN "verificationCode" SET NOT NULL;

CREATE UNIQUE INDEX "certificates_verificationCode_key" ON "certificates"("verificationCode");
CREATE INDEX "certificates_issuedById_idx" ON "certificates"("issuedById");

ALTER TABLE "certificates"
  ADD CONSTRAINT "certificates_issuedById_fkey"
  FOREIGN KEY ("issuedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
