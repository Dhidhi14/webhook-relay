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

## Next: Day 4 — Event ingestion + idempotency + fan-out
