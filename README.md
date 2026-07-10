# WebhookRelay

WebhookRelay is a reliable webhook delivery system. Producers send events to the API, and WebhookRelay delivers them to subscriber endpoints with HMAC-SHA256 signed payloads, exponential-backoff retries, and dead-letter handling.

## Why

Direct HTTP calls between services fail silently when the receiver is down. WebhookRelay guarantees at-least-once delivery with full observability — every attempt is logged, failures are retried, and exhausted deliveries can be replayed.

## Stack

Node.js, Express, MongoDB, Redis, BullMQ, Docker

## Roadmap

- [x] Server foundation
- [ ] Auth JWT + API keys
- [ ] Endpoint management
- [ ] Event ingestion with idempotency
- [ ] Delivery worker with HMAC signing
- [ ] Retries + dead-letter queue
- [ ] Logs/replay/stats
- [ ] Swagger + tests + docker-compose
