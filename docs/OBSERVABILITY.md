# JUSTSAY Observability, Logging & Metrics

## Structured JSON Logging
All system logs are emitted in structured JSON format containing:
- `timestamp`: ISO 8601 epoch timestamp.
- `level`: `INFO`, `WARN`, `ERROR`, or `DEBUG`.
- `service`: `justsay-api`, `background-worker`, or `admin-plane`.
- `requestId`: Correlation identifier for request tracing across services.
- `operation`: Specific API or worker task name.
- `durationMs`: Execution timing in milliseconds.

## Sensitive Field Scrubbing
The `LoggerService` automatically redacts sensitive parameters from log metadata:
- `password`, `token`, `authorization`, `messageText`, `ip`, `deviceFingerprint`, `privateKey`.

## Health Check Specifications
- `GET /health`: Liveness check verifying process execution.
- `GET /ready`: Readiness check inspecting PostgreSQL, Redis, Worker, and Object Storage reachability.
