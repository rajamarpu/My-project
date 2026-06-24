# Backend Structure

This folder contains the Express API and server-side helpers.

## Folder Map

- `config/` - Prisma client and other runtime config.
- `middleware/` - Authentication, authorization, and request middleware.
- `routes/` - All API route modules grouped by domain.
- `utils/` - Shared backend helpers such as tokens, activity logging, mail, and validation.
- `server.js` - Main Express app entry point.
- `loadEnv.js` - Environment loader used before server startup.

## Route Domains

- `authRoutes.js` - Login, registration, OTP, OAuth, and password flows.
- `courseRoutes.js` - Courses, enrollment, instructor switching, and course data.
- `progressRoutes.js` - Learner progress and analytics.
- `certificateRoutes.js` - Certificate issuance, listing, and deletion.
- `adminRoutes.js` - Admin overview, analytics, and management endpoints.
- `productionRoutes.js` - Learner portal, notifications, payments, saved courses, and community.
- `assessmentRoutes.js` - Assignment submission and evaluation workflows.
- `questionRoutes.js` - Question management and validation.
- `chatRoutes.v2.js` - Chat rooms, messages, and presence.
- `personalityRoutes.js` - AI personality and mentor mode support.

## Guidance

- Keep request validation close to the route that owns the data.
- Put shared business logic in `utils/` instead of duplicating it across routes.
- Add new route modules only when they represent a real domain or workflow.
