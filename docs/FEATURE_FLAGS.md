# JUSTSAY Feature Flags & Deterministic Rollouts

## Feature Flags Architecture
Feature flags enable dynamic capability toggling and safe gradual percentage rollouts across consumer clients.

## Deterministic Bucketing
Rollout cohorts are computed deterministically using MD5 hashing over `flagKey:userHandle`:
- Ensures a user remains consistently inside or outside a rollout percentage cohort.
- Prevents random user state switching across app sessions.

## Active System Feature Flags
- `card_studio_v2`: Advanced multi-layer canvas controls and ratio presets (Default: 100%).
- `image_uploads`: Custom image uploads with magic byte validation (Default: 100%).
- `gif_support`: Animated sticker integration (Default: 0%).
- `anonymous_replies`: Anonymous story card generation from inbox messages (Default: 100%).
- `ai_moderation_v2`: Multi-layer risk classification pipeline (Default: 100%).
- `story_export_v2`: Native Android story export and sharing (Default: 100%).
- `new_profile_ui`: Curated profile themes and QR card previews (Default: 50%).
