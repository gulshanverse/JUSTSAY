# JUSTSAY Architecture Overview

## Monorepo Layout
```text
JUSTSAY
│
├── apps/
│   ├── android/     # Native Android Client (Kotlin, Jetpack Compose, Room Cache)
│   ├── api/         # Backend API Gateway (TypeScript, NestJS Modular Monolith)
│   ├── admin/       # Web-based Admin Portal
│   └── web/         # Web Application / Public Link Landing Page
│
├── packages/
│   ├── contracts/   # Shared API DTOs and OpenAPI specs
│   ├── validation/  # Zod validation schemas
│   └── shared-types/# Data models & enums
│
├── database/
│   ├── migrations/  # PostgreSQL DDL migrations
│   └── seeds/       # Isolated development seeds
│
├── infrastructure/  # Docker, Redis & S3 abstractions
├── docs/            # Platform specification docs
└── tests/           # Integration & End-to-End suites
```

## Android Clean Architecture Protocol
The native Android client is structured into 4 isolated layers:

```
[UI Views] ──► [ViewModels] ──► [Use Cases (Domain)] ──► [Repository Interface]
                                                              │
                                                   ┌──────────┴──────────┐
                                                   ▼                     ▼
                                           [Remote API Service]   [Local Room Cache]
```

### Layer Responsibilities
1. **Presentation Layer (`com.justsay.app.presentation`)**
   - Renders Compose UI (`HomeScreen`, `InboxScreen`, `CardStudioScreen`, `AdminDashboardScreen`).
   - Collects `StateFlow` from ViewModel with lifecycle awareness.
   - Contains zero business or moderation logic.

2. **Domain Layer (`com.justsay.app.domain`)**
   - Pure Kotlin entity models (`Message`, `Recipient`, `ModerationState`, `Reaction`, `Reply`, `CardDesign`).
   - Business use cases (`GetInboxMessagesUseCase`, `SendAnonymousMessageUseCase`, `EvaluateMessageModerationUseCase`).
   - Abstractions for `MessageRepository`, `ModerationService`, `AdminAuthRepository`, `FeatureFlagRepository`.

3. **Data Layer (`com.justsay.app.data`)**
   - **Local persistence**: Room database (`JustSayDatabase`) strictly acting as an offline-first cache.
   - **Remote service**: `JustSayApiService` connecting to backend REST endpoints (`/api/v1/...`).
   - Repository implementation (`MessageRepositoryImpl`) orchestrates network fetch + cache update.

4. **Core Layer (`com.justsay.app.core`)**
   - Network interceptors, Token Managers, Encryption utilities, and App Logger.

## Data Flow & Synchronization Strategy
- **Write Path**: Senders send messages directly through `POST /api/v1/messages`. Server evaluates moderation state asynchronously.
- **Read Path**: Android client queries `MessageRepository`. Room cache provides instant local render; background fetch updates cache reactive flows.
