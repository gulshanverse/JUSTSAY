# JUSTSAY Operational Runbook & Maintenance

## Operational Procedures
This guide details day-to-day operations, maintenance routines, and incident response procedures for JUSTSAY platform maintainers.

## Database Maintenance
- **PostgreSQL Connection Pool**: Default 20 connections per API instance. Monitored via `/ready` endpoint.
- **Migration Execution**: Idempotent SQL scripts executed sequentially from `database/migrations/`.
- **Data Cleanup Sweep**: Background worker executes periodic purges for expired sessions (>30 days) and deleted user media assets.

## Incident Escalation Matrix
- **Level 1 (Degraded Response / Cache Misses)**: Automatic fallback to memory cache.
- **Level 2 (Database Unreachable)**: Readiness probe fails; traffic automatically drained from affected pod.
- **Level 3 (Security Breach / Abuse Spike)**: Execute immediate session revocation via Admin Control Plane.
