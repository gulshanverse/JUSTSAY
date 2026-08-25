# JUSTSAY API Specification (v1)

Base URL: `/api/v1`

## System & Health
- `GET /api/v1/health` - Health check status & uptime

## Authentication & Account
- `POST /api/v1/auth/register` - Register new account with scrypt password hashing (N=131072)
- `POST /api/v1/auth/login` - Authenticate account, receive opaque session token, transparent legacy rehash
- `POST /api/v1/auth/logout` - Revoke current session token
- `DELETE /api/v1/users/account` - Delete account and revoke all sessions

## Handles & User Profile
- `POST /api/v1/handles/check` - Check handle availability
- `GET /api/v1/users/profile/:handle` - Public profile lookup
- `PATCH /api/v1/users/profile` - Update profile bio, prompt, preferences (Authenticated)

## Messages & Inbox
- `POST /api/v1/messages` - Post anonymous message (Rate limited, validated, moderated)
- `GET /api/v1/messages?filter=all|unread|favorites|flagged` - Recipient inbox (Authenticated)
- `PATCH /api/v1/messages/:id/read` - Mark message as read
- `PATCH /api/v1/messages/:id/favorite` - Toggle message favorite status
- `POST /api/v1/messages/:id/reactions` - Add reaction emoji (`❤️`, `😂`, `😭`, `👀`, `🔥`, `💀`)
- `POST /api/v1/messages/:id/replies` - Recipient reply to message
- `POST /api/v1/messages/:id/report` - Report message (Harassment, Threat, Hate, Sexual content, Spam, Self-harm, Scam, Other)
- `POST /api/v1/messages/:id/block` - Block anonymous sender via AnonymousAbuseKey abstraction
- `DELETE /api/v1/messages/:id` - Delete message from inbox

## Card Studio & Creative Engine
- `GET /api/v1/cards/templates` - List designer templates (Confession, Crush, Question, Funny, Y2K, etc.)
- `GET /api/v1/cards/stickers` - List curated sticker catalog
- `POST /api/v1/cards/projects` - Create card project (Story 9:16, Square 1:1, Portrait 4:5, Presets, Layers)
- `GET /api/v1/cards/projects` - List owned card projects (Authenticated)
- `GET /api/v1/cards/projects/:id` - Get card project details (Owner only)
- `PATCH /api/v1/cards/projects/:id` - Update card project elements & background (Owner only)
- `DELETE /api/v1/cards/projects/:id` - Delete card project (Owner only)
- `POST /api/v1/cards/from-message` - Convert inbox confession to Card Project (Zero telemetry leak)

## Media Storage
- `POST /api/v1/media/upload` - Validate MIME & upload image asset (PNG, JPEG, WebP, max 5MB)
- `GET /api/v1/media/assets/:id` - Retrieve uploaded media asset metadata

## Public Web
- `GET /u/:handle` - Public mobile-first web sender page with XSS escaping
