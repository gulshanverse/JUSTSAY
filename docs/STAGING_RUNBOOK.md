# STAGING DEPLOYMENT RUNBOOK & OPERATIONAL GUIDELINES

## Overview
This runbook documents the steps required to deploy, operate, and maintain JUSTSAY in a real cloud staging or production environment.

## Environment Variables Configuration Matrix

| Variable | Required | Secret | Dev Default | Staging Required | Production Required | Description / Security Mandate |
| :--- | :---: | :---: | :--- | :---: | :---: | :--- |
| `NODE_ENV` | Yes | No | `development` | `staging` | `production` | Execution environment mode. |
| `PORT` | No | No | `3000` | `3000` | `3000` | HTTP listening port for backend API. |
| `API_PREFIX` | No | No | `/api/v1` | `/api/v1` | `/api/v1` | API base path prefix. |
| `SESSION_SECRET` | Yes | **YES** | `dev_session_secret...` | **Custom (Min 32 chars)** | **Custom (Min 32 chars)** | Key for session cookie/JWT signing. Must NOT use dev default. |
| `ADMIN_SECRET` | Yes | **YES** | `dev_admin_jwt_secret...` | **Custom (Min 32 chars)** | **Custom (Min 32 chars)** | Key for admin token derivation. Must NOT use dev default. |
| `DATABASE_URL` | Yes | **YES** | `postgres://localhost...` | **Real PostgreSQL TLS URL** | **Real PostgreSQL TLS URL** | PostgreSQL connection string (`postgresql://user:pass@host:5432/db?sslmode=require`). |
| `DB_MAX_CONNECTIONS` | No | No | `20` | `20` | `50` | Maximum connection pool size. |
| `DB_IDLE_TIMEOUT_MS` | No | No | `30000` | `30000` | `30000` | Connection idle timeout in milliseconds. |
| `DB_CONNECT_TIMEOUT_MS` | No | No | `5000` | `5000` | `5000` | Connection timeout in milliseconds. |
| `DB_SSL` | No | No | `false` | `true` | `true` | Mandates TLS for database connection. |
| `REDIS_URL` | Yes | **YES** | `redis://localhost:6379` | **Real Redis TLS URL** | **Real Redis TLS URL** | Redis cache/rate limit connection string (`rediss://:pass@host:6379`). |
| `REDIS_KEY_PREFIX` | No | No | `justsay:` | `justsay:staging:` | `justsay:prod:` | Redis key namespace prefix. |
| `REDIS_CONNECT_TIMEOUT_MS` | No | No | `5000` | `5000` | `5000` | Redis connection timeout in milliseconds. |
| `REDIS_MAX_RETRIES` | No | No | `3` | `3` | `5` | Maximum Redis retry attempts. |
| `STORAGE_PROVIDER` | Yes | No | `memory` | `gcs` or `s3` | `gcs` or `s3` | Object storage provider mode. |
| `OBJECT_STORAGE_BUCKET` | Yes | No | `justsay-media...` | **Real Cloud Bucket** | **Real Cloud Bucket** | Name of the cloud object storage bucket. |
| `OBJECT_STORAGE_REGION` | Yes | No | `us-central1` | `us-central1` | `us-central1` | Cloud storage region. |
| `STORAGE_SIGNED_URL_TTL` | No | No | `3600` | `3600` | `3600` | Expiration time for signed download/upload URLs (in seconds). |
| `FCM_ENABLED` | No | No | `false` | `true` | `true` | Enables Firebase Cloud Messaging push dispatch. |
| `FCM_PROJECT_ID` | Conditional | No | None | **Firebase Project ID** | **Firebase Project ID** | Required when `FCM_ENABLED=true`. |
| `FCM_CLIENT_EMAIL` | Conditional | **YES** | None | **Service Account Email** | **Service Account Email** | Service account email for FCM HTTP v1 API. |
| `FCM_PRIVATE_KEY` | Conditional | **YES** | None | **Service Account RSA Key** | **Service Account RSA Key** | Private key for FCM HTTP v1 API authentication. |
| `MODERATION_PROVIDER` | No | No | `keyword` | `ai` or `keyword` | `ai` | Moderation engine mode (`keyword` or `ai`). |
| `MODERATION_AUTO_BLOCK_THRESHOLD` | No | No | `0.85` | `0.85` | `0.85` | Auto-block confidence threshold for toxic text. |

---

## Deployment & Verification Commands

### 1. Verification of Backend Infrastructure
```bash
# Run unit and integration test suite
npm test

# Build API target
npm run build --prefix apps/api
```

### 2. Verification of Android Application
```bash
# Run unit tests
gradle :app:testDebugUnitTest

# Compile Android application
gradle :app:assembleDebug
```

---

## Rollback Procedure
In the event of a failed staging or production deployment:
1. **API Rollback**: Revert container deployment to previous image tag (`docker-compose -f docker-compose.prod.yml down && docker-compose -f docker-compose.prod.yml up -d`).
2. **Database Schema Rollback**: Backwards-compatible migrations allow instant rollback without data loss. If irreversible schema migrations were applied, restore from the latest snapshot using `database/backup.sh`.
3. **Android Client Rollback**: Roll back staged rollouts in Google Play Console or re-issue previous version build.
