# JUSTSAY PostgreSQL Database Specification

## Relational Schema Layout (23 Core Tables)

1. `users` (id UUID PK, email, password_hash, created_at)
2. `profiles` (id UUID PK, user_id FK, handle UNIQUE, avatar_url, bio, created_at)
3. `user_preferences` (id UUID PK, user_id FK, preference_key, preference_value)
4. `sessions` (id UUID PK, user_id FK, token_hash, expires_at)
5. `confession_links` (id UUID PK, profile_id FK, prompt_text, click_count, is_active)
6. `messages` (id UUID PK, recipient_profile_id FK, message_text, prompt_question, moderation_status ENUM, sentiment, is_read, is_favorite, created_at)
7. `message_reactions` (id UUID PK, message_id FK, reaction_type, created_at)
8. `message_replies` (id UUID PK, message_id FK, reply_text, created_at)
9. `blocks` (id UUID PK, recipient_profile_id FK, blocked_identifier_hash, created_at)
10. `reports` (id UUID PK, message_id FK, reporter_id FK, reason, created_at)
11. `moderation_cases` (id UUID PK, message_id FK, status ENUM, assigned_admin_id FK, created_at)
12. `moderation_events` (id UUID PK, case_id FK, action, details, timestamp)
13. `media_assets` (id UUID PK, owner_id FK, storage_key, mime_type, size, created_at)
14. `card_templates` (id UUID PK, name, gradient_start_hex, gradient_end_hex, sticker_tag, category)
15. `card_projects` (id UUID PK, profile_id FK, template_id FK, custom_prompt)
16. `card_elements` (id UUID PK, project_id FK, element_type, properties_json)
17. `notifications` (id UUID PK, user_id FK, title, body, is_read, created_at)
18. `notification_preferences` (id UUID PK, user_id FK, push_enabled, email_enabled)
19. `analytics_events` (id UUID PK, event_name, properties_json, timestamp)
20. `feature_flags` (id UUID PK, flag_key UNIQUE, is_enabled, rollout_percentage)
21. `admin_users` (id UUID PK, email, password_hash, role ENUM)
22. `admin_roles` (id UUID PK, role_name, permissions_json)
23. `admin_audit_logs` (id UUID PK, admin_id FK, action, details, severity, timestamp)

## Key Constraints & Indexes
- Index on `messages(recipient_profile_id, created_at DESC)` for high-performance inbox queries.
- Index on `profiles(handle)` for fast public link resolution.
- Foreign keys with `ON DELETE CASCADE` where appropriate.
