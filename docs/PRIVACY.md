# JUSTSAY Privacy Guidelines

## Strict Privacy Mandates
1. **No Sensitive PII Collection**: JUSTSAY strictly forbids collecting precise GPS location, device hardware serial numbers, contacts, advertising IDs, or IP logs for analytics.
2. **Coarse Hints Protocol**: Senders can voluntarily include safe, non-identifying contextual tags (e.g., "Sent via Web Client"). Hardcoded or invasive location strings are strictly prohibited.
3. **Recipient Decoupling**: Recipients never receive network sockets, IP addresses, or account credentials of message submitters. Internal telemetry (`_internalSenderIp`, `_internalDeviceFingerprint`) is isolated server-side for anti-abuse and strictly omitted from all recipient DTOs.
4. **Data Retention & Account Deletion**: Account deletion immediately invalidates all active session tokens and permanently purges user credentials and profile records.
5. **Analytics Privacy**: Analytics logs redact passwords, session tokens, message text, and IP addresses.
