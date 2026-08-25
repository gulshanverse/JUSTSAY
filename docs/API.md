# JUSTSAY API Specification (v1)

Base URL: `/api/v1`

## System & Health
- `GET /api/v1/health` - Health check status & uptime

## User & Profile Management
- `GET /api/v1/profile/:handle` - Retrieve recipient profile & active confession card prompt
- `POST /api/v1/profile` - Create or update user handle and preferences

## Messages & Inbox
- `POST /api/v1/messages` - Submit an anonymous confession message
- `GET /api/v1/messages` - Retrieve recipient inbox messages (Authenticated)
- `PATCH /api/v1/messages/:id/read` - Mark message as read
- `POST /api/v1/messages/:id/reactions` - Toggle favorite / heart reaction
- `POST /api/v1/messages/:id/replies` - Attach public story reply to message
- `POST /api/v1/messages/:id/report` - Submit harassment / abuse report
- `POST /api/v1/users/:id/block` - Block anonymous sender pattern

## Card Studio
- `GET /api/v1/cards/templates` - Fetch curated card design templates
- `POST /api/v1/cards` - Save custom card studio design project
- `PATCH /api/v1/cards/:id` - Update card design parameters

## Media Management
- `POST /api/v1/media/upload` - Request presigned URL for story background upload

## Admin & Telemetry (RBAC Required)
- `GET /api/v1/admin/moderation` - Fetch flagged moderation cases
- `POST /api/v1/admin/moderation/:id/approve` - Approve flagged message
- `POST /api/v1/admin/moderation/:id/reject` - Delete/Reject flagged message
- `GET /api/v1/admin/audit-logs` - Retrieve system telemetry audit events
