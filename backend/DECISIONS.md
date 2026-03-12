# DECISIONS.md

This file documents the technical choices made during development, the problems encountered along the way, and an honest assessment of what could be done better with more time.

---

## Technical choices and why

### Express over NestJS

The exercise gives 24 hours. NestJS is a solid framework with strong conventions, built-in dependency injection, and a module system that scales well — but it also comes with significant setup overhead. For a project of this size, Express is a better fit. It is simpler, faster to get running, and requires less boilerplate. The trade-off is that structure and conventions need to be enforced manually, which is why the codebase is organised into explicit `controllers/`, `routes/`, and `models/` folders.

If this were a longer-term production project with a larger team, NestJS would be the more defensible choice.

### TypeScript throughout

JavaScript would have been faster to write, but TypeScript was chosen from the start because the exercise explicitly evaluates code quality. Having types on the Mongoose schema, the request and response handlers, and the aggregation results catches a whole class of bugs at compile time and makes the intent of each function much clearer to anyone reading the code.

The `strict` mode is enabled in `tsconfig.json`, which forces explicit handling of nullable values and avoids silent runtime errors.

### MongoDB and Mongoose

MongoDB is specified in the exercise. Mongoose was chosen over the raw MongoDB Node.js driver because it provides schema-level validation, a cleaner API, and the `$expr` operator support needed for the ad-serving query (comparing two fields within the same document). Indexes were defined in the schema on `status`, `advertiser`, `targetCountries`, and a compound index on all four fields used in the ad-serving filter, so that query does not perform a full collection scan.

### Budget as max impressions

The campaign model has a `budget` field (e.g. `10000`) but no cost-per-impression field. The ad-serving logic needs a numeric cap to know when a campaign is exhausted. Rather than inventing a CPM or cost field that does not exist in the spec, the simplest and most defensible interpretation is to treat `budget` as the maximum number of impressions the campaign is allowed to serve.

This means a campaign with `budget: 10000` will serve at most 10,000 impressions before it stops being eligible. If the intent was monetary (e.g. 10,000 euros with a variable CPM), a `costPerImpression` or `cpm` field would need to be added to the model and the ad-serving query would need to compare `impressionsServed * costPerImpression < budget`.

### Atomic ad serving with findOneAndUpdate

The `POST /serve-ad` endpoint needs to both find an eligible campaign and increment its `impressionsServed` counter without a race condition. If two requests arrive at the same time, a naive find-then-update approach could serve both impressions from a campaign that only had one remaining.

The solution is `findOneAndUpdate` with all eligibility conditions inside the filter and `$inc` in the update. MongoDB evaluates the filter and applies the update atomically at the document level. This means a campaign that is already at budget cannot be double-served, even under concurrent load.

### Ad selection when multiple campaigns match

When more than one campaign is eligible for a given country, `findOneAndUpdate` returns whichever document MongoDB finds first based on its internal query plan (natural order or index order). This is effectively arbitrary. A fairer approach would be to randomise the selection or rotate by least-served, but that requires fetching all eligible campaigns first, choosing one in application code, and then doing a conditional update — which is more complex and reintroduces the race condition problem.

For this exercise, the simpler approach was kept and this trade-off is documented here.

### express-validator for input validation

All request bodies are validated before they reach the controller. The validation rules live in the route file alongside the route definition so they are easy to find and modify. Among the things validated: date format, endDate must be after startDate, budget must be a positive number, country codes must be exactly 2 characters, and targetCountries must be a non-empty array. Any validation failure returns a 400 with the full list of errors.

---

## Problems encountered

### TypeScript strict mode and Mongoose types

Mongoose's aggregate method is generic (`aggregate<T>()`) but the inferred type for the result array is `T[]`. With strict mode on, accessing `result[0]?.total` raised a type error because `T` was not guaranteed to have a `total` property. The fix was to explicitly pass the expected shape as the generic type argument, for example `aggregate<{ total: number }>([...])`, which tells TypeScript exactly what shape to expect from the pipeline output.

### Express 5 async error handling

Express 5 automatically forwards errors thrown in async route handlers to the global error handler, which is a significant improvement over Express 4 where you had to manually call `next(err)` in every catch block. However, not all type definitions were updated to reflect this at the time of writing — `@types/express` still expects the older callback style in some places. The workaround was to use `Promise<void>` return types and let the global error handler catch anything that escapes a controller.

### MONGO_URI not validated at startup

Early in development, the server would start and only fail when the first request hit the database, producing a confusing error. The fix was to validate `MONGO_URI` in the `connectDB` function before calling `mongoose.connect`, and call `process.exit(1)` if it is missing or if the connection fails. This makes misconfiguration obvious immediately at startup rather than silently at request time.

---

## What would be improved with more time

### PATCH /campaigns/:id

There is currently no way to update a campaign after creation. In practice, a campaign manager would need to pause a campaign, adjust its end date, or increase its budget. Adding a PATCH endpoint with the same validation rules applied partially (only validating fields that are present in the body) would make the API actually usable.

### Automatic status transitions

A campaign whose `endDate` has passed should have its status set to `ended` automatically. Right now, its status stays as `active` in the database but the ad-serving query correctly excludes it by checking the date. This is functionally correct but confusing when listing campaigns — an "active" campaign that is past its end date looks wrong to anyone reading the data. A background job (or a pre-find Mongoose middleware hook) could handle this transition cleanly.

### Redis for high-traffic ad serving

The `POST /serve-ad` endpoint hits MongoDB on every single request to find and update an eligible campaign. For high traffic this becomes a bottleneck. A more scalable design would maintain a Redis sorted set of eligible campaigns per country, keep impression counters in Redis with atomic `INCR` operations, and sync back to MongoDB asynchronously in batches. This reduces per-request database load significantly.

### Rate limiting on serve-ad

The ad-serving endpoint is the most latency-sensitive and the most vulnerable to abuse. Adding `express-rate-limit` with a short window (e.g. 60 requests per minute per IP) would prevent a single client from exhausting a campaign's budget. This was not added within the time constraint but would be a near-zero-effort improvement.

### Unit and integration tests

The business logic in the ad controller — eligibility checks, atomic increment, 404 when no campaign matches — is the most critical part of the codebase and has no automated tests. A test suite using Jest and supertest against a test MongoDB database (or `mongodb-memory-server` for in-process testing with no external dependency) would give confidence that the ad-serving invariants hold under various conditions: expired campaigns, wrong country, budget exactly at limit, and concurrent requests.

### Structured logging

`console.log` and `console.error` are used throughout. For a production system, replacing these with a structured logger like `pino` would make it possible to query logs by field (e.g. by campaign ID, by country, by response time) and feed them into a log aggregator. This was out of scope for this exercise but would be one of the first things added before a real deployment.
