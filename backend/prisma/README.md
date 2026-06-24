# Prisma Structure

This folder holds the database schema and migration history.

## Files

- `schema.prisma` - Current Prisma schema used by the app.
- `migrations/` - Ordered SQL migrations for PostgreSQL.
- `seed.js` - Seed script for local development and demo data.
- `schema-new.prisma` - Alternate schema snapshot kept for reference.
- `prisma.config.ts` - Prisma CLI configuration.

## Guidance

- Keep schema changes migration-backed.
- Use `seed.js` to generate repeatable demo data.
- Avoid adding unrelated SQL files here unless they are part of Prisma or database bootstrapping.
