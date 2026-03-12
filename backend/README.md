# Backend

This is the backend for a mini AdTech platform that manages and serves video ad campaigns. It exposes a REST API built with Node.js and Express, using MongoDB as the database. The goal is to let you create campaigns, list them with filters, simulate ad impressions, and get platform-wide statistics.

---

## Tech Stack

- **Node.js** — runtime environment
- **Express 5** — HTTP framework for defining routes and middleware
- **TypeScript** — used across the entire codebase for type safety
- **MongoDB** — primary database for storing campaigns
- **Mongoose** — ODM layer for schema definition, validation, and indexing
- **express-validator** — input validation on request bodies and query params
- **dotenv** — loads environment variables from a `.env` file
- **cors** — enables cross-origin requests from the frontend
- **ts-node-dev** — development server that runs TypeScript directly with auto-restart

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.ts                  # MongoDB connection logic
│   ├── controllers/
│   │   ├── campaignController.ts  # Handles create and list campaign logic
│   │   ├── adController.ts        # Handles ad serving logic
│   │   └── statsController.ts     # Handles aggregated statistics
│   ├── models/
│   │   └── Campaign.ts            # Mongoose schema and TypeScript types
│   ├── routes/
│   │   ├── campaigns.routes.ts
│   │   ├── serveAd.routes.ts
│   │   └── stats.routes.ts
│   └── server.ts                  # Express app entry point
├── .env.example                   # Environment variable template
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A running MongoDB instance, either locally or via MongoDB Atlas

### Installation

```bash
cd backend
npm install
```

### Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/adtech
```

### Run in development

```bash
npm run dev
```

### Build and run for production

```bash
npm run build
npm start
```

---

## API Endpoints

### POST /campaigns

Creates a new ad campaign.

**Request body**

```json
{
  "name": "Summer Campaign",
  "advertiser": "Nike",
  "startDate": "2026-06-01",
  "endDate": "2026-07-01",
  "budget": 10000,
  "targetCountries": ["FR", "ES"],
  "status": "active"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| name | string | yes | |
| advertiser | string | yes | |
| startDate | ISO 8601 date | yes | |
| endDate | ISO 8601 date | yes | Must be after startDate |
| budget | number | yes | Maximum number of impressions allowed |
| targetCountries | array of strings | yes | 2-letter ISO country codes, e.g. "FR" |
| status | active, paused, or ended | no | Defaults to active |

**Response** — `201 Created` with the created campaign object.

---

### GET /campaigns

Returns a list of campaigns, sorted by creation date descending.

**Optional query parameters**

| Param | Example | Description |
|---|---|---|
| status | ?status=active | Filter by campaign status |
| advertiser | ?advertiser=Nike | Case-insensitive partial match on advertiser name |
| country | ?country=FR | Returns campaigns that target this country |

**Response** — `200 OK` with an array of campaign objects.

---

### POST /serve-ad

Simulates an ad impression for a given country. This is the core ad-serving logic.

**Request body**

```json
{ "country": "FR" }
```

The API finds an eligible campaign by checking all of the following conditions:

1. Status is active
2. Current date is within startDate and endDate
3. The campaign targets the requested country
4. impressionsServed is still below budget

If a match is found, `impressionsServed` is incremented atomically in a single database operation to avoid race conditions. The served campaign is then returned.

**Responses**

- `200 OK` — the campaign that was served
- `404 Not Found` — no eligible campaign exists for the given country

---

### GET /stats

Returns aggregated platform statistics.

**Response**

```json
{
  "totalCampaigns": 12,
  "activeCampaigns": 5,
  "totalImpressions": 48200,
  "topAdvertiser": "Nike"
}
```

| Field | Description |
|---|---|
| totalCampaigns | Total number of campaigns in the database |
| activeCampaigns | Number of campaigns currently in active status |
| totalImpressions | Sum of impressionsServed across all campaigns |
| topAdvertiser | Advertiser with the highest total impressions served |

---

### GET /health

Returns a simple status check.

```json
{ "status": "ok" }
```

---

## Campaign Model

| Field | Type | Default |
|---|---|---|
| name | String | |
| advertiser | String | |
| startDate | Date | |
| endDate | Date | |
| budget | Number | |
| impressionsServed | Number | 0 |
| targetCountries | Array of strings | |
| status | active, paused, or ended | active |
| createdAt | Date | auto-generated |
| updatedAt | Date | auto-updated |

MongoDB indexes are set on `status`, `advertiser`, `targetCountries`, and a compound index on `status + targetCountries + startDate + endDate` to keep the ad-serving query fast.

---

## Notes on budget

The `budget` field represents the maximum number of impressions a campaign is allowed to serve. Once `impressionsServed` reaches that number, the campaign is no longer eligible for ad serving. This interpretation was chosen because no cost-per-impression value is defined in the data model — see `DECISIONS.md` for the full reasoning.
