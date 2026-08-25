# JUSTSAY Security & Authorization Architecture

## Threat Model & Guarantees
1. **Zero Client Security Trust**: The Android application does NOT determine authorization or moderation decisions. All operations are authorized server-side using cryptographic JWT tokens and RBAC middleware.
2. **Elimination of Hardcoded Credentials**: No default admin PINs (`admin123`, `admin`), API keys, or JWT secrets exist in source code. All secrets are loaded strictly from environment variables or secure key vaults.
3. **Sender Anonymity Non-Repudiation**:
   - Sender identities are strictly decoupled from message payloads at database & network layers.
   - Senders cannot be traced by recipients via IP address, device fingerprints, or precise location headers.

## Role-Based Access Control (RBAC)
```
[Unauthenticated User] ──► Limited Public Endpoints (POST /messages, GET /profile/:handle)
[Authenticated User]   ──► Recipient Inbox (GET /messages), Reply, Block, Report
[Admin / Moderator]    ──► Admin Moderation Queue, Audit Logs, Telemetry (Bearer JWT + RBAC)
```

## Anti-Abuse & Rate Limiting Strategy
- IP & Fingerprint rate limits on message submission (e.g. max 5 messages per 10 minutes per IP).
- Token Bucket algorithm implemented via Redis for endpoint protection.
- Automated anomaly detection for rapid link scanning or targeted harassment campaigns.
