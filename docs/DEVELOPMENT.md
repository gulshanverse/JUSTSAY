# JUSTSAY Development Guide

## Prerequisites
- Android Studio / Android SDK (API 36)
- Node.js 20+ & npm
- PostgreSQL 16+

## Building the Android Client
```bash
./gradlew clean
./gradlew assembleDebug
./gradlew test
```

## Running Backend API Services
```bash
cd apps/api
npm install
npm run build
npm run test
```

## Running Database Seeds (Development Only)
```bash
psql -U postgres -d justsay_dev -f database/migrations/001_initial_schema.sql
psql -U postgres -d justsay_dev -f database/seeds/development/001_dev_seed.sql
```
