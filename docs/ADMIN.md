# JUSTSAY Admin Control Plane Architecture

## Overview
The JUSTSAY Admin Control Plane (`apps/admin`) is a standalone, high-security operational web interface separated entirely from the Android consumer application.

## Role-Based Access Control (RBAC)
The platform enforces explicit server-side authorization across five hierarchical roles:

| Role | Hierarchy Level | Capabilities |
| :--- | :---: | :--- |
| **SUPPORT** | 1 | Read-only inspection of user profile handles and basic queue status. |
| **AUDITOR** | 1 | Access to compliance reports and system metrics. |
| **MODERATOR** | 2 | Action on moderation queue items (`approve`, `reject`, `escalate`). |
| **ADMIN** | 3 | Manage user accounts (`suspend`, `restore`) and toggle feature flags. |
| **SUPER_ADMIN** | 4 | Full administrative privileges, audit log inspection, and high-risk operations. |

## Append-Only Audit Logging
Every sensitive administrative action generates a structured, immutable audit log entry containing:
- `id`: Unique audit log entry identifier.
- `adminId`: Admin account performing the action.
- `role`: Admin role at execution time.
- `action`: Specific administrative operation (e.g., `USER_SUSPEND`, `MODERATION_APPROVE`).
- `targetType`: Target domain (`user`, `message`, `moderation`, `feature_flag`, `system`).
- `targetId`: Target handle or item ID.
- `timestamp`: Epoch timestamp.
