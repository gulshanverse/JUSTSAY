# JUSTSAY Product Roadmap

## Phase 1: Production Foundation (CURRENT)
- Refactor Android client into Clean Architecture (`com.justsay.app`).
- Remove hardcoded client-side admin PIN authentication (`admin123`).
- Implement PostgreSQL database migration schema (23 core tables).
- Build TypeScript / NestJS Backend API foundation (`/api/v1/...`).
- Create shared packages (`contracts`, `validation`, `shared-types`).
- Implement decoupled `ModerationService` and privacy abstractions.

## Phase 2: Live Backend Sync & Auth
- Connect Firebase/Google Identity Services & JWT bearer tokens.
- Live PostgreSQL + Redis rate-limiting integration.

## Phase 3: Media Uploads & Advanced Card Studio
- Object storage presigned URLs for story image backgrounds.
- Real-time collaborative card templates.

## Phase 4: Full Multi-Platform Rollout
- Web client (`apps/web`) and Admin Web Portal (`apps/admin`).
