# JUSTSAY Data Retention & Privacy Policy

## Data Retention Schedule
To safeguard user privacy and maintain system efficiency, JUSTSAY enforces strict data retention boundaries:

| Data Domain | Retention Period | Post-Expiry Action |
| :--- | :--- | :--- |
| **Active Sessions** | 30 days | Automatic invalidation and purge. |
| **Inbox Messages** | User-controlled / 90 days | Soft-delete upon user request or expiration. |
| **Draft Cards** | Local device primary | Cleared on user account deletion. |
| **Media Assets** | Duration of active card | Garbage-collected upon card deletion. |
| **Moderation Events** | 180 days | Retained for safety audit and abuse prevention. |
| **Audit Logs** | 365 days | Retained for security and compliance audits. |

## Account Deletion Workflow
When a user requests account deletion:
1. All auth tokens and active sessions are revoked immediately.
2. User profile handle and bio are unlinked and marked available/deleted.
3. Private card projects and draft records are hard deleted.
4. Uploaded media assets are scheduled for object storage purging.
5. All anonymous sender linkage identifiers (`AnonymousAbuseKey`) remain non-identifiable.
