# DECISIONS.md

This file documents the key frontend choices made for the exercise, the issues encountered during implementation, and what would be improved with more time.

---

## Technical choices and why

### React + TypeScript with Vite

The exercise is time-boxed (24h), so setup speed mattered. Vite was chosen because it gives a fast React + TypeScript bootstrap with very low configuration overhead. TypeScript was kept from day one to reduce runtime mistakes in API integration and to make component contracts explicit.

This was especially useful for campaign and stats payloads where frontend and backend need to stay aligned.

### Tailwind CSS for fast UI delivery

Tailwind was chosen to build all required pages quickly while keeping styles consistent. For this type of technical exercise, utility-first styling allows focusing on product behavior rather than spending time writing and maintaining custom CSS architecture.

The interface intentionally stays simple and readable, with reusable class patterns for forms, tables, and cards.

### React Router with explicit page mapping

The requirement explicitly asks for 3 pages, so routing is defined directly in `App.tsx`:

- `/campaigns`
- `/campaigns/new`
- `/dashboard`

This keeps the navigation model clear and maps one-to-one to the expected deliverables.

### Axios wrapper for API communication

A single Axios client (`src/api/client.ts`) was introduced instead of calling `fetch` directly in each page. The main reason is centralizing `baseURL` and headers so API calls remain consistent and easier to evolve later (for interceptors, auth, retries, etc.).

### Separation of concerns in frontend structure

The frontend was split into:

- `pages/` for route-level screens
- `components/` for reusable UI blocks (navbar)
- `types/` for shared contracts (`Campaign`, `Stats`)
- `api/` for backend communication

This avoids putting business logic and UI logic in one place and keeps each file focused.

### Client-side validation on campaign creation

Validation is performed before calling `POST /campaigns` to improve UX and avoid unnecessary requests. Rules mirror backend constraints as much as possible:

- required fields
- `endDate > startDate`
- positive budget
- valid 2-letter country codes

Backend errors are still displayed when server-side validation fails, which preserves data integrity.

### Filter-driven campaign listing

The campaign list page includes filters for `status`, `advertiser`, and `country` because these are supported by backend query params and directly useful for the user workflow. The page fetches data reactively when filters change to keep the UI straightforward.

---

## Problems encountered

### Vite and Tailwind plugin version conflicts

During setup, package compatibility issues appeared between Vite versions and `@tailwindcss/vite` peer dependencies. The fix was to pin compatible package versions instead of mixing very new major versions with plugins that had not yet updated peer ranges.

### Wrong Tailwind import in `vite.config.ts`

At one point, `tailwindcss` was imported directly as a Vite plugin, which does not work. The correct integration is importing `@tailwindcss/vite` and registering that plugin.

### Double-active navigation state in navbar

`/campaigns` and `/campaigns/new` were both highlighted as active. Root cause: `NavLink` prefix matching. Fix: add `end` on the `/campaigns` link so only exact matches mark it active.

### Type-only import errors with strict TS config

When `verbatimModuleSyntax` is enabled, types must be imported with `import type`. This caused compile errors for campaign/status types. The fix was to convert those imports to type-only imports.

### Backend availability impacts frontend testing

Part of frontend validation was blocked intermittently when MongoDB Atlas access failed on backend startup. The UI error states handled this correctly, but full end-to-end testing depended on restoring backend connectivity.

---

## What would be improved with more time

### Add campaign edit flow

A complete management UI should allow editing existing campaigns (status changes, dates, budget updates). This depends on adding a backend `PATCH /campaigns/:id` endpoint and wiring an edit page/modal on frontend.

### Add dedicated ad-serving simulation UI

The backend exposes `POST /serve-ad`, but there is no dedicated frontend screen for it yet. A simple testing panel (select country + trigger serve + show returned campaign) would complete the product flow.

### Introduce a global notification system

Current feedback is page-local text messages. A global toast system would improve consistency for success and error messages across all pages.

### Improve data fetching strategy

Current fetching is manual with `useEffect`. For a production-grade frontend, using TanStack Query would improve caching, retries, background refresh, and loading/error handling consistency.

### Add debouncing for text filters

`advertiser` and `country` filters currently trigger immediate requests on each change. Debouncing would reduce API calls and improve UX on slower networks.

### Add frontend tests

No automated tests are currently in place. Priority test targets would be:

- Create campaign form validation behavior
- Filter query behavior on campaign list
- Dashboard rendering with API success/failure states

### Improve accessibility

Basic semantics are present, but a11y could be strengthened with better focus management, clearer error aria bindings, and keyboard-first interaction checks.

