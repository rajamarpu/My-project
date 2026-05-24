# Frontend Architecture Review

## Current Weak Spots

- The product identity leaned on real celebrity instructor data, which made the LMS feel derivative and legally fragile instead of like a proprietary AI learning platform.
- `App.jsx` eagerly imports almost every page, creating a large bundle and making admin/user separation harder to reason about.
- Admin routes are protected by role, but they still use the public `MainLayout`; the admin product should have its own shell, nav, auth entry, route tree, and port.
- Auth was compressed into login/register only. Forgot password, reset password, OTP verification, social buttons, remember-me state, and toast-like feedback were missing.
- Course cards had weak hierarchy: no teacher avatar, no progress, no lesson count, no tags, and limited interaction depth.
- Folder structure is close but not aligned with the requested contract: `redux/` should become `store/`, `services/` should become `api/`, and page folders should be normalized to `Auth`, `Courses`, `Dashboard`, and `Admin`.
- The light-mode global overrides are too broad and fight component-level styling. Keep one design system and avoid broad `!important` selectors.

## Implemented In This Pass

- Replaced celebrity-personality data with original virtual AI teachers: Nova Quinn, Aria Vale, Kai Vector, and Mira Sol.
- Redesigned the landing page around the core differentiator: live AI teacher switching, voice/tone previews, teacher cards, learning paths, categories, testimonials, FAQ, and modern motion.
- Upgraded course cards with AI teacher avatar, specialty, rating metadata, lesson count, tags, progress bar, hover lift, and stronger visual hierarchy.
- Added routes and UI states for `/forgot-password`, `/reset-password`, and `/otp-verification`.
- Added `dev:user` on port `5173` and `dev:admin` on port `5174`; Vite now defaults to `5173`.

## Target Folder Structure

```txt
src/
├── api/
│   ├── client.js
│   ├── auth.api.js
│   ├── courses.api.js
│   ├── teachers.api.js
│   └── admin.api.js
├── assets/
├── components/
│   ├── common/
│   └── ui/
├── constants/
├── hooks/
├── layouts/
│   ├── PublicLayout.jsx
│   ├── LearnerLayout.jsx
│   └── AdminLayout.jsx
├── pages/
│   ├── Auth/
│   ├── Courses/
│   ├── Dashboard/
│   └── Admin/
├── routes/
│   ├── user.routes.jsx
│   ├── admin.routes.jsx
│   └── ProtectedRoute.jsx
├── store/
├── styles/
├── utils/
├── App.jsx
└── main.jsx
```

## Production Roadmap

1. Split routes into `user.routes.jsx` and `admin.routes.jsx`, then lazy-load all page modules with `React.lazy` and route-level skeletons.
2. Move `src/redux` to `src/store`, split auth, courses, teachers, notifications, theme, and admin slices.
3. Move `src/services/api.js` into `src/api/client.js` plus domain API files. Add refresh-token retry logic and centralized error normalization.
4. Create `AdminLayout` and run admin independently at `localhost:5174`; keep learner/public app at `localhost:5173`.
5. Build the AI teacher flow as a first-class feature: teacher selector page, teacher preview modal, voice preview control, active teacher switcher inside the learning player, and transition animation.
6. Expand course listing with search suggestions, category tabs, sort menu, difficulty chips, skeleton loading, and infinite scrolling.
7. Upgrade dashboard hierarchy: continue learning first, then mentor suggestion, weekly chart, skill radar, certificates, recent activity, and upcoming sessions.
8. Replace broad global light-mode overrides with design tokens in Tailwind and component variants.
9. Add accessibility passes: visible focus states, semantic form errors, `aria-live` toasts, keyboard navigable filters, and reduced-motion support.
10. Add frontend tests around protected routing, auth flows, course filtering, and teacher switching.

## Design System Direction

- Base: dark AI interface using deep navy surfaces, cyan/fuchsia/amber accents, glass panels, and restrained glow.
- Typography: large hero type only on landing; compact dashboard headings and dense operational admin text.
- Components: `Button`, `GlassCard`, `StatCard`, `CourseCard`, `TeacherCard`, `SearchCommand`, `FilterDrawer`, `ProgressRing`, `MetricCard`, `DataTable`, `EmptyState`, `Toast`.
- Motion: page transitions, hover lift, teacher switch crossfade, skeleton shimmer, scroll reveal, and subtle floating particles only in auth/landing surfaces.

## What To Remove Or Redesign

- Remove real-celebrity instructor framing and invalid external celebrity images.
- Remove admin pages from the public layout.
- Redesign the sidebar filters as a responsive drawer with chips, counts, and applied-filter summary.
- Redesign dashboard cards so they read as workflows, not disconnected stats.
- Replace copy that describes generic course marketplace value with copy about AI teachers, voice, tone, switching, and adaptive learning.
