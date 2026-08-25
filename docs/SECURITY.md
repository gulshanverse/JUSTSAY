# JUSTSAY Security & Authorization Architecture

## Threat Model & Guarantees
1. **Zero Client Security Trust**: The Android application does NOT determine authorization or moderation decisions. All operations are authorized server-side using opaque session tokens hashed in server storage.
2. **Slow Adaptive Password Hashing (scrypt)**:
   - Passwords are hashed using scrypt (`N=16384, r=8, p=1`) with a unique 16-byte cryptographically secure random salt per user.
   - Formatted as `$scrypt$N=16384,r=8,p=1$<saltHex>$<hashHex>`.
   - Constant-time verification prevents timing attacks (`crypto.timingSafeEqual`).
   - Plaintext passwords, tokens, and credentials are never stored, logged, or sent to analytics.
3. **Opaque Bearer Session Security**:
   - Client receives opaque session tokens (`session_access_<hex>`).
   - Server stores only SHA-256 hashes of active session tokens.
   - Immediate session revocation occurs on logout and account deletion.
4. **Sender Anonymity Isolation**:
   - Recipient DTOs explicitly strip internal sender IP and device fingerprint telemetry.
   - Senders cannot be identified by recipients via IP address, device fingerprints, or headers.

## Role-Based Access Control (RBAC)
```
[Unauthenticated User] ──► Limited Public Endpoints (POST /messages, GET /u/:handle)
[Authenticated User]   ──► Recipient Inbox, Reply, React, Block, Report, Delete Account
[Admin / Moderator]    ──► Admin Moderation Queue, Audit Logs (Bearer token + RBAC)
```

## Anti-Abuse & Rate Limiting Strategy
- IP rate limits on registration, login, handle checking, and anonymous message posting.
- Recipient-based anonymous sender blocking without revealing sender identity to recipients.
- Automated anomaly detection for rapid link scanning or targeted harassment campaigns.
