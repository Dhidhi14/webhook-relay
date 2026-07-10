# WebhookRelay PRD

## Problem
Service-to-service HTTP notifications fail silently when the receiver is down.
WebhookRelay guarantees at-least-once delivery with signed payloads, retries,
dead-lettering, and observability.

## Core Flows
1. Register/login -> JWT + apiKey
2. Create endpoint (url + eventTypes) -> HMAC secret shown ONCE
3. POST /events with idempotencyKey -> fan-out to matching endpoints
4. Worker delivers with HMAC headers, 5s timeout
5. Failure -> exponential backoff retries (5 attempts)
6. Exhausted -> dead-letter, replayable via API
7. Delivery logs with attempt timelines + stats

## MVP
Auth, endpoint CRUD, event ingestion + idempotency, HMAC delivery worker,
retries + dead-letter, logs/replay/stats, rate limiting + Swagger, tests, Docker.

## Out of Scope V1
Frontend UI, payload transformation, ordering guarantees.
