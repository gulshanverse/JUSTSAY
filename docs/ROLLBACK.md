# DEPLOYMENT ROLLBACK PROCEDURES

## Overview
This runbook defines the emergency rollback strategy for JUSTSAY API services, database migrations, and Android client releases.

## 1. Backend API Rollback
When a deployed API container fails health/readiness checks or exhibits runtime errors:

1. **Stop Failing Deployment**:
   ```bash
   docker-compose -f docker-compose.prod.yml down
   ```
2. **Revert to Last Known Good Tag**:
   ```bash
   docker pull ghcr.io/gulshanverse/justsay-api:v1.0.0-previous
   docker-compose -f docker-compose.prod.yml up -d
   ```
3. **Verify Liveness and Readiness**:
   ```bash
   curl -f http://localhost:3000/api/v1/health/liveness
   curl -f http://localhost:3000/api/v1/health/readiness
   ```

---

## 2. Database Migration Rollback
JUSTSAY migrations are designed to be forward-compatible (expand-and-contract pattern).

- **Non-Breaking Schema Changes**: (e.g. adding nullable columns or indexes) Require no DB rollback; previous API version operates without issue.
- **Breaking Schema Changes**: If an irreversible migration was executed, perform point-in-time restore (PITR) from the pre-migration snapshot as documented in `docs/BACKUP_RESTORE.md`.

---

## 3. Android Client Rollback
- **Google Play Console**: Halt staged rollout percentage immediately.
- **Version Compatibility**: API endpoints maintain backwards-compatible DTO structures to prevent crashing legacy client app builds.
