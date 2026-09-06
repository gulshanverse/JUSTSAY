# JUSTSAY Analytics Pipeline & Funnel Measurement

## Overview
JUSTSAY provides a privacy-first analytics event tracking pipeline designed to measure product adoption funnels without compromising anonymous user privacy or collecting personal identifiable information.

## Privacy Rules & Forbidden Metadata
The analytics pipeline strictly strips and forbids recording the following sensitive metadata fields:
- `messageText` / `replyText` / `cardContent`
- `password` / `authToken` / `sessionToken`
- `email` / `phone`
- `ipAddress` / `deviceFingerprint`
- `preciseLocation`

## Monitored Product Funnel Steps
1. `profile_created`: Account setup complete.
2. `link_shared`: Profile link copied or shared.
3. `public_profile_viewed`: Web lander visit.
4. `message_sent`: Anonymous submission received.
5. `message_opened`: Message read in recipient inbox.
6. `card_created`: Message converted into card studio project.
7. `card_shared`: Story card exported to social platforms.
