# Components Structure

Reusable UI lives here.

## Groups

- `common/` - Generic components such as buttons, cards, inputs, loaders, modals, and error states.
- `ui/` - Product-specific interface components such as navbar, sidebar, dashboard widgets, auth panels, and course cards.
- `admin/` - Admin panel widgets, tables, notices, and shared admin UI pieces.
- `questions/` - Question rendering and grading helpers.

## Guidance

- Add reusable components here when they are used across multiple pages.
- Keep page-specific visual logic inside the page unless it is clearly reusable.
- Prefer small, named subfolders for related pieces rather than flat dumping everything into one directory.
