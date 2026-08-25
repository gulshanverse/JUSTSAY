# JUSTSAY Moderation Engine

## Moderation Lifecycle & State Machine
Every incoming message transitions through an explicit moderation state:

```text
[Message Submitting] ──► PENDING ──► [Server AI Moderation Engine]
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               ▼                            ▼                            ▼
          APPROVED                     SOFT_BLOCKED                   REJECTED
    (Visible in Inbox)              (Held for Admin)             (Toxic / Dropped)
               │                            │                            │
               └────────────────────────────┼────────────────────────────┘
                                            ▼
                                        ESCALATED
                                (Admin Review Dashboard)
```

## Multi-Tier Evaluation
1. **Tier 1 (Automated Heuristics)**: Fast regex & keyword safety filter.
2. **Tier 2 (AI Toxicity Service)**: Server-side Gemini API evaluating harassment, cyberbullying, hate speech, and spam probability.
3. **Tier 3 (Admin Human Review)**: Flagged messages appear in the Admin Dashboard for manual Approval or Purge actions.
