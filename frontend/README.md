# AdTech Campaign Manager - Frontend

Frontend application for the technical exercise "Fullstack React / Node.js".

This app provides the UI to manage ad campaigns and visualize platform statistics.

## Objective

Build a simple React interface connected to the backend API to cover the required product flows:

- List campaigns with key business fields
- Create a campaign with form validation
- Display dashboard statistics

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios

## Implemented Requirements Mapping

The following requirements from the exercise are implemented:

- Page 1 - Campaign list
  - Displays name, advertiser, status, impressions, budget
  - Adds useful filters: status, advertiser, country
- Page 2 - Campaign creation
  - Full form with client-side validation
  - Server validation errors are surfaced in the UI
- Page 3 - Stats dashboard
  - Displays active campaigns, total impressions, top advertiser
- Frontend architecture
  - Clean separation between pages, components, API client, and shared types

## Project Structure

```text
src/
  api/
    client.ts                # Axios instance (base URL from env)
  components/
    Navbar.tsx               # Main navigation
  pages/
    CampaignList.tsx         # Campaign listing + filters
    CreateCampaign.tsx       # Campaign creation form + validation
    Dashboard.tsx            # Stats dashboard
  types/
    campaign.ts              # Campaign and status types
    stats.ts                 # Stats response type
  App.tsx                    # Routes and page layout
  main.tsx                   # App bootstrap
  index.css                  # Tailwind entry
```

## Routes

- `/campaigns` -> Campaign list page
- `/campaigns/new` -> Create campaign page
- `/dashboard` -> Statistics dashboard
- `/` -> Redirects to `/campaigns`

## Backend API Integration

The frontend uses these backend endpoints:

- `GET /campaigns`
  - Used by `CampaignList.tsx`
  - Supports query filters: `status`, `advertiser`, `country`
- `POST /campaigns`
  - Used by `CreateCampaign.tsx`
  - Sends form payload after client validation
- `GET /stats`
  - Used by `Dashboard.tsx`
  - Renders summary cards

## Environment Variables

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

`VITE_API_URL` is consumed in `src/api/client.ts`.

## Local Setup

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Run dev server:

```bash
npm run dev
```

3. Start backend in a separate terminal:

```bash
cd backend
npm run dev
```

## UX and Validation Notes

- Campaign form validations:
  - Required fields (name, advertiser, dates, budget, target countries)
  - `endDate` must be after `startDate`
  - Budget must be a positive number
  - Countries must be 2-letter ISO codes
- Loading and error states are handled on all pages
- The navbar uses exact route matching for `/campaigns` to avoid double-active links when visiting `/campaigns/new`

## Known Limitations and Next Improvements

- No campaign edit flow yet (`PATCH /campaigns/:id` not implemented in frontend)
- No dedicated UI for `POST /serve-ad` simulation
- No global toast/notification system yet
- No automated frontend tests yet

## Build

```bash
npm run build
npm run preview
```
