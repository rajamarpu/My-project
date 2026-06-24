# Frontend Structure

This folder contains the React app.

## Folder Map

- `api/` - Axios client and endpoint wrappers.
- `assets/` - Static images and icons used by the app.
- `components/` - Reusable UI building blocks.
- `constants/` - Routes, validation, theme, and other app-wide constants.
- `hooks/` - Shared custom hooks.
- `layouts/` - App shell layouts for public, learner, and admin views.
- `pages/` - Route screens organized by feature area.
- `routes/` - Route helpers such as protected routing wrappers.
- `store/` - Redux store, slices, and providers.
- `styles/` - Global CSS, design tokens, and animation styles.
- `utils/` - Shared helper functions.

## Page Groups

- `pages/Auth` - Login, register, password reset, and callbacks.
- `pages/Landing` - Public landing pages and not-found screen.
- `pages/Dashboard` - Learner, instructor, profile, certificates, and community dashboards.
- `pages/Courses` - Course browsing, player, assessments, and LMS utility pages.
- `pages/Admin` - Admin operations, analytics, approvals, and management tools.

## Naming Notes

- Keep route screens in `pages/`.
- Keep reusable widgets in `components/`.
- Keep feature-specific helpers close to the feature when they are not shared globally.
- Prefer clear names like `AdminDashboard.jsx`, `StudentDashboard.jsx`, and `CourseDetailPage.jsx`.
