# JUSTSAY Continuous Integration & Delivery (CI/CD)

## Pipeline Workflows
The repository uses GitHub Actions (`.github/workflows/ci.yml`) to enforce code quality and build verification on pull requests and branch pushes:

1. **Backend CI**:
   - Spins up PostgreSQL 15 & Redis 7 container services.
   - Executes TypeScript type checks and linting.
   - Runs integration test suite (`npx tsx apps/api/src/test/api.test.ts`).

2. **Android CI**:
   - Sets up JDK 17.
   - Executes unit tests (`./gradlew test`).
   - Compiles debug APK bundle (`./gradlew assembleDebug`).

3. **Admin CI**:
   - Verifies Admin control plane type definitions and contract compatibility.

## Branch Protection Recommendations
- Require status checks to pass before merging (`backend-test-and-build`, `android-test-and-build`).
- Block direct pushes to `main` and `release/*` branches.
