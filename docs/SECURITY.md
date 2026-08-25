# JUSTSAY Security & Authorization Architecture

## Threat Model & Guarantees
1. **Zero Client Security Trust**: The Android application does NOT determine authorization or moderation decisions. All operations are authorized server-side using opaque session tokens hashed in server storage.
2. **Slow Adaptive Password Hashing (scrypt - OWASP Baseline)**:
   - Passwords are hashed using scrypt (`N=131072, r=8, p=1, keyLen=64`) with a unique 16-byte cryptographically secure random salt per user.
   - Formatted as `$scrypt$N=131072,r=8,p=1$<saltHex>$<hashHex>`.
   - Constant-time verification prevents timing attacks (`crypto.timingSafeEqual`).
   - Transparent Hash Migration: Legacy development hashes (`N=16384`) are verified and automatically re-hashed to `N=131072` baseline upon successful login.
   - Plaintext passwords, tokens, and credentials are never stored, logged, or sent to analytics.
3. **Opaque Bearer Session Security**:
   - Client receives opaque session tokens (`session_access_<hex>`).
   - Server stores only SHA-256 hashes of active session tokens.
   - Immediate session revocation occurs on logout and account deletion.
4. **Sender Anonymity Isolation & AnonymousAbuseKey Abstraction**:
   - Internal sender IP and device fingerprint telemetry are isolated server-side.
   - Anonymous Blocking derives a non-reversible `AnonymousAbuseKey` (`sha256(clientIp + salt)`). Block entries prevent future messaging without exposing IP addresses, fingerprints, or abuse keys to recipients.
   - Recipient DTOs explicitly strip internal sender IP and device fingerprint telemetry.
5. **Card Studio & Media Security**:
   - Strict Card Project Ownership Isolation: Card projects (`card_projects`) are private to the creator account. Cross-account project reading or mutation returns HTTP 403 Forbidden.
   - Media Upload Validation: MediaStorageService validates declared MIME types (`image/png`, `image/jpeg`, `image/webp`) and enforces strict 5MB maximum file size limits.

## Role-Based Access Control (RBAC)
```
[Unauthenticated User] ──► Limited Public Endpoints (POST /messages, GET /u/:handle)
[Authenticated User]   ──► Recipient Inbox, Reply, React, Block, Report, Delete Account, Card Studio CRUD, Media Upload
[Admin / Moderator]    ──► Admin Moderation Queue, Audit Logs (Bearer token + RBAC)
```

## Anti-Abuse & Rate Limiting Strategy
- IP rate limits on registration, login, handle checking, anonymous message posting, and card creation.
- AnonymousAbuseKey sender blocking without revealing sender identity to recipients.
- Automated anomaly detection for rapid link scanning or targeted harassment campaigns.
