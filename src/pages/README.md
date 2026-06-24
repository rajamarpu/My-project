# Pages Structure

Route screens live here. Each subfolder groups a feature area so the app stays easy to navigate.

## Folders

- `Admin/` - Admin dashboards, approvals, analytics, reports, and management screens.
- `Auth/` - Login, register, password reset, and authentication callback screens.
- `Courses/` - Explore, detail, player, assessments, and LMS workflow screens.
- `Dashboard/` - Learner, instructor, profile, community, and certificate screens.
- `Landing/` - Public landing pages and the not-found page.

## What Goes Where

- Put a file here when it represents a full route or page.
- Keep smaller reusable widgets in `src/components/`.
- If a page starts growing too much, split page-only subcomponents into a local helper file or a subfolder next to the page.

## Naming Pattern

- Use descriptive names that match the route purpose, such as `StudentDashboard.jsx`, `CourseDetailPage.jsx`, and `AdminReportsPage.jsx`.
