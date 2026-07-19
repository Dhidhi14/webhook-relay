# WebhookRelay Progress Log

## Day 0 — Setup
- Done: project structure, .cursorrules, PRD, .gitignore, npm deps (ES modules), Docker + Redis container, MongoDB Atlas, GitHub repo created and pushed.
- Error: `cat << EOF` paste in Git Bash corrupted .cursorrules and PRD.md (blank lines broke the heredoc). Fix: rewrote files via editor/agent instead of terminal heredoc.
- Error: Redis image pull failed mid-download (CDN EOF). Fix: retried with `docker pull redis:7-alpine` — resumed clean.

## Day 1 — Foundation
- Done: env.js (zod-validated config), db.js, redis.js (maxRetriesPerRequest: null), Winston logger, AppError, global error handler, Express app (helmet/cors/morgan), GET /health, graceful shutdown, .env.example.
- Verified: MongoDB connected, /health returns { success: true }.
- No errors.

## Day 2 — Authentication
- Done: User model (toJSON strips passwordHash/apiKey), register/login (bcrypt 10 rounds, JWT), API key generation `whr_` + rotation, require-jwt + require-api-key middlewares, zod validation middleware.
- Tests: 5/5 passed (register, login, rotate-key, duplicate email → 409, wrong password → 401).
- Design notes: identical error message for unknown email vs wrong password (prevents user enumeration); duplicate email caught via Mongo error 11000.

## Infra — Cluster migration (side task)
- Done: created Atlas project ProjectsDB + cluster MainCluster; repointed both WebhookRelay (/webhookrelay) and BrokerFree (/brokerfree) .env files; verified both connect; terminated old clusters/projects.
- Error: IP access entry stuck "Inactive". Cause: project had no cluster yet. Fix: created the cluster; entry auto-activated.
- Error: BrokerFree "not connected". Cause: its .env still had the old cluster string. Fix: replaced with MainCluster string.
- Error: BrokerFree crashed EADDRINUSE :5000. Cause: another server on the port. Fix: stopped it, reran.
- Error: pre-Day-3 verification showed wrong /health response shape on :5000. Cause: BrokerFree dev server left running was answering instead of WebhookRelay. Fix: killed stale node PID, restarted WebhookRelay, all checks passed.

## Day 3 — Endpoint Management
- Done: Endpoint model (toJSON strips secret), CRUD with ownership checks, one-time secret exposure at creation, JWT-protected routes, reactivation resets consecutiveDeadCount.
- Tests: 6/6 passed (create w/ secret, list w/o secret, get w/o secret, PATCH isActive toggle, invalid URL → 400, unknown id → 404).
- Design notes: 404 (not 403) for not-owned endpoints — no information leak; prevents IDOR.

## Day 4 — Event ingestion + idempotency + fan-out
- Done: Event model (compound unique index on user + idempotencyKey), Delivery model, BullMQ delivery queue (5 attempts, exponential backoff), ingestEvent service with fan-out to active matching endpoints, POST /api/events protected by require-api-key.
- Errors: none.
- Tests: 4/4 passed (new event → 1 delivery + job enqueued, duplicate → no new deliveries, unknown type → 0 deliveries, missing idempotencyKey → 400). Redis keys confirmed (bull:deliveries:wait, bull:deliveries:1).

## Day 5 — Delivery worker with HMAC signing
- Done: signature.service (HMAC-SHA256 sign/verify), delivery.service deliverOne (axios POST with signed headers, 5s timeout, attempt logging), worker.js (BullMQ Worker, concurrency 5, graceful shutdown).
- Errors: Day 4 backlog job first attempt failed HTTP 404 (endpoint still had placeholder URL when worker started); succeeded on BullMQ retry after PATCH to webhook.site.
- Tests: backlog job processed (retry → success), fresh event evt-hmac-1 → delivery status success with 1 attempt (HTTP 200, 656ms).

## Day 6 — Dead-letter handling + endpoint auto-disable
- Done: worker `failed` handler marks delivery `dead` when attempts exhausted, increments endpoint `consecutiveDeadCount`, auto-disables endpoint at >= 10 with warning log; confirmed success path resets `consecutiveDeadCount` to 0 (Day 5).
- Errors: stale Day 5 worker still running caused first test (evt-fail-1) to miss dead-letter handling; `npm run` on Windows did not pass `BACKOFF_DELAY_MS` override — fixed by starting via `node src/server.js` with inline env; httpstat.us intermittently returns ECONNRESET/timeouts.
- Tests: evt-fail-3 → 5 attempts, delivery `dead`, endpoint `consecutiveDeadCount: 1`; worker logs show attempt N/5 progression and dead marking on exhaustion.

## Day 7 — Delivery logs, replay API, stats
- Done: delivery-query.service (list/get/replay/stats), JWT-protected routes GET /api/deliveries, GET /api/deliveries/:id, POST /api/deliveries/:id/replay, GET /api/stats; replay re-enqueues dead deliveries without erasing attempt history.
- Errors: none.
- Tests: 6/6 passed (list dead, get with timeline, replay dead → pending → dead with 10 attempts, replay success → 400, stats sanity check, pagination limit=2).

## Day 8 — Rate limiting + Swagger + security review
- Done: authLimiter (10/15min) on /api/auth, apiLimiter (100/15min) on other /api routes, OpenAPI 3 spec at GET /docs, delivery list query validation (status enum).
- Errors: Express 5 req.query is read-only — fixed validateQuery to use req.validatedQuery instead.
- Tests: 4/4 passed (/docs 200, 11th wrong login → 429, JWT /api/deliveries works on separate limiter bucket, security review clean with one fix).

## Day 9 — Automated Jest test suite
- Done: Jest + Supertest + mongodb-memory-server; `tests/env.js` sets test env before imports; `tests/setup.js` spins up in-memory Mongo, clears collections between tests, mocks queue via `setEnqueueDelivery`, tears down queue + Redis on exit.
- Production tweaks: `setEnqueueDelivery()` override in delivery.queue.js; rate limiters skipped when `NODE_ENV === 'test'`.
- Test files: signature (5 unit), auth (4 integration), idempotency (1), e2e (1 — register → endpoint → event → pending delivery + mocked enqueue).
- Errors: Jest hung after run (open Redis/BullMQ handles) — fixed by closing deliveryQueue and quitting redis in afterAll.
- Tests: 11/11 passed (`npm test`, ~4s, clean exit).

## Day 10 (part 1) — Docker deployment packaging
- Done: Dockerfile (node:20-alpine, npm ci --omit=dev, non-root user, shared image for api/worker via CMD override), docker-compose.yml (api:5000, worker, mongo w/ named volume, redis; healthchecks + depends_on), `.env.docker` for compose secrets, `.env.example` compose section, `scripts/seed.js` (idempotent demo user/endpoint/3 events).
- Errors: port 5000 EADDRINUSE (stale local node) — killed PID; Docker CDN EOF on image pull — retried; httpbin slow from container (1/3 deliveries success, 2 dead after retries) — worker pipeline confirmed either way.
- Verified: `docker compose up --build`, `/health` 200, seed inside api container, worker logs show job completion + retry/dead-letter, inspect-db `{ success: 1, dead: 2 }`, second seed run all duplicates, `docker compose down`.
- Diagnosis (api "stopped" during verification): not a crash — `docker compose down` ran while a background combined verify command was still executing; compose file had no restart policy and Redis/Mongo lacked error/disconnect handlers (hardened in follow-up). Stability re-test: api Up 11 min, `/health` 200 at start and end (uptime 677s).

## Project complete — all 10 days done, final acceptance passed
