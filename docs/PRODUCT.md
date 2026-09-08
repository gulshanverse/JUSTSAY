# JUSTSAY Core Product Specification & Growth Loop Mechanics

## Core Product Vision
JUSTSAY is a modern, privacy-first, expressive social experience built around honest anonymous confessions and creative story card sharing.

## Growth Loop Architecture
The viral acquisition engine relies on a self-reinforcing flywheel:

```
CREATE PROFILE
    │
    ▼
GET JUSTSAY LINK (justsay.app/@handle)
    │
    ▼
SHARE LINK (Instagram / Snapchat Story / TikTok)
    │
    ▼
FRIEND OPENS PROFILE (Public Visitor Web)
    │
    ▼
SEND ANONYMOUS MESSAGE
    │
    ▼
RECIPIENT RECEIVES MESSAGE (Secret Inbox)
    │
    ▼
REACT / REPLY
    │
    ▼
CREATE BEAUTIFUL STORY CARD (Card Studio)
    │
    ▼
SHARE STORY CARD TO SOCIALS
    │
    ▼
NEW USERS DISCOVER JUSTSAY VIA STORY CARD WATERMARK
    │
    └──────────────────────► CREATE PROFILE
```

## Functional Product Matrix
1. **Onboarding & Auth**: Rapid email/password registration with unique `@handle` availability checks and zero-friction sign in.
2. **Profile Experience**: Personalized home showing user avatar, display name, handle, custom prompts, and copyable `justsay.app/@handle` share links.
3. **Public Profile Web**: Ultra-fast public composer (`/u/:handle`) optimized for mobile web visitors with character counters, prompt chips, and privacy reassurances.
4. **Secret Inbox**: Organized message view with read/unread indicators, favorite starring, flagged status, and instant reaction/reply controls.
5. **Card Studio Engine**: Creative story editor allowing users to transform inbox confessions into 9:16, 1:1, or 4:5 social cards with presets, stickers, custom text, layer reordering, and undo/redo capabilities.
6. **Safety & Moderation Control Plane**: Multi-tier AI moderation filter (keyword & score based), recipient blocking, message reporting, and admin support console.
