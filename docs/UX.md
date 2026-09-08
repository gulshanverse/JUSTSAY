# JUSTSAY Visual System & UX Architecture

## Visual Design Principles

1. **Modern & Expressive (Gen-Z Aesthetic)**: Bold typography, deep dark canvas (`#0D0714`), high-contrast pink (`#FFFF2A85`) accents, and vibrant gradient highlights (`#00F5D4`, `#9B5DE5`).
2. **Restraint & Purpose**: Avoid unnecessary glassmorphism, neon clutter, or unstyled card lists. Every visual element serves a clear interaction or communication goal.
3. **Privacy Assurance**: Reassure senders that messages are 100% anonymous without cluttering screens with legalistic disclaimers or fake typing/online indicators.
4. **Touch Ergonomics**: All interactive buttons enforce a minimum 48dp touch target with instant visual ripple feedback.

## Design System Tokens

### Typography
- Display: Bold, high-weight headers for brand identity and headlines
- Body: Readable, scaled `sp` fonts for confessions, messages, and input prompts
- Labels: Sharp, uppercase badges for tags, timestamps, and status indicators

### Color Palette
- Canvas Background: `#0D0714` (Deep Space Dark)
- Card Container: `#1B0E2E` (Plum Velvet)
- Primary Accent: `#FFFF2A85` (Electric Pink)
- Secondary Accent: `#00F5D4` (Neon Mint)
- Text Primary: `#FFFFFF` (Pure White)
- Text Muted: `#A093BA` (Soft Lavender)

### Surface & Elevation
- Corner Radius: 16.dp for input cards, 24.dp for primary containers, 50% for badges and action chips
- Borders: Subtle 1.dp to 2.dp strokes with transparent white/pink alpha for visual depth

## Accessibility & Safety UX
- All icons feature descriptive `contentDescription` tags for screen reader compatibility.
- Contrast ratios meet WCAG AA standards across dark mode surfaces.
- One-tap blocking (`AnonymousAbuseKey`) and flagging options available on every received confession.
