import {
  AdminRole,
  AdminAuditLogEntry,
  ModerationStatus,
  SystemHealthStatus,
  UserDto
} from '@justsay/shared-types';
import { ServerModerationService } from '../moderation/moderation.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { AnalyticsService } from '../analytics/analytics.service';

export class AdminController {
  private auditLogs: AdminAuditLogEntry[] = [];

  constructor(
    private moderationService?: ServerModerationService,
    private featureFlagsService?: FeatureFlagsService,
    private analyticsService?: AnalyticsService
  ) {}

  public async loginAdmin(req: { authToken: string }): Promise<{ authenticated: boolean; role: AdminRole; token: string }> {
    if (!req.authToken) {
      return { authenticated: false, role: AdminRole.SUPPORT, token: '' };
    }

    let role: AdminRole = AdminRole.SUPPORT;

    if (req.authToken.includes('super')) {
      role = AdminRole.SUPER_ADMIN;
    } else if (req.authToken.includes('admin')) {
      role = AdminRole.ADMIN;
    } else if (req.authToken.includes('moderator')) {
      role = AdminRole.MODERATOR;
    } else if (req.authToken.includes('Bearer ') || req.authToken.includes('support')) {
      role = AdminRole.SUPPORT;
    } else {
      return { authenticated: false, role: AdminRole.SUPPORT, token: '' };
    }

    const token = `admin_jwt_${role.toLowerCase()}_${Date.now()}`;
    this.recordAuditLog('system', role, 'ADMIN_LOGIN', 'system', 'admin_auth', { authenticated: true });

    return { authenticated: true, role, token };
  }

  // Audit Log Management (Append-only)
  public recordAuditLog(
    adminId: string,
    role: AdminRole,
    action: string,
    targetType: AdminAuditLogEntry['targetType'],
    targetId: string,
    details?: Record<string, any>
  ): AdminAuditLogEntry {
    const entry: AdminAuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      adminId,
      role,
      action,
      targetType,
      targetId,
      details,
      timestamp: Date.now()
    };
    this.auditLogs.push(entry);
    return entry;
  }

  public getAuditLogs(role: AdminRole): AdminAuditLogEntry[] {
    // Only ADMIN or SUPER_ADMIN can inspect full audit logs
    if (role !== AdminRole.ADMIN && role !== AdminRole.SUPER_ADMIN) {
      throw new Error('FORBIDDEN: Insufficient RBAC privileges to view audit logs');
    }
    return [...this.auditLogs];
  }

  // RBAC Permission Check Utility
  private checkPermission(adminRole: AdminRole, requiredRole: AdminRole): boolean {
    const hierarchy = {
      [AdminRole.SUPPORT]: 1,
      [AdminRole.AUDITOR]: 1,
      [AdminRole.MODERATOR]: 2,
      [AdminRole.ADMIN]: 3,
      [AdminRole.SUPER_ADMIN]: 4
    };
    return (hierarchy[adminRole] || 0) >= (hierarchy[requiredRole] || 99);
  }

  // Moderation Queue Administration
  public getModerationQueue(adminRole: AdminRole) {
    if (!this.checkPermission(adminRole, AdminRole.SUPPORT)) {
      throw new Error('FORBIDDEN: Authorization failed');
    }
    return this.moderationService ? this.moderationService.getPendingQueue() : [];
  }

  public actOnModerationItem(adminRole: AdminRole, adminId: string, id: string, action: 'approve' | 'reject' | 'escalate') {
    if (!this.checkPermission(adminRole, AdminRole.MODERATOR)) {
      throw new Error('FORBIDDEN: Moderator privileges required to perform moderation actions');
    }

    const statusMap: Record<string, ModerationStatus> = {
      approve: ModerationStatus.APPROVED,
      reject: ModerationStatus.REJECTED,
      escalate: ModerationStatus.ESCALATED
    };

    const targetStatus = statusMap[action];
    const updated = this.moderationService?.updateQueueStatus(id, targetStatus);
    if (!updated) throw new Error('NOT_FOUND: Moderation queue item not found');

    this.recordAuditLog(adminId, adminRole, `MODERATION_${action.toUpperCase()}`, 'moderation', id, {
      previousStatus: updated.status,
      newStatus: targetStatus
    });

    return updated;
  }

  // User Management
  public performUserAction(adminRole: AdminRole, adminId: string, targetHandle: string, action: 'suspend' | 'restore') {
    if (!this.checkPermission(adminRole, AdminRole.ADMIN)) {
      throw new Error('FORBIDDEN: Admin privileges required to manage user statuses');
    }

    this.recordAuditLog(adminId, adminRole, `USER_${action.toUpperCase()}`, 'user', targetHandle);
    return { success: true, targetHandle, status: action === 'suspend' ? 'SUSPENDED' : 'ACTIVE' };
  }

  // System Health Dashboard
  public getSystemHealth(): SystemHealthStatus {
    return {
      status: 'HEALTHY',
      timestamp: Date.now(),
      services: {
        api: { status: 'HEALTHY', version: '1.0.0' },
        database: { status: 'HEALTHY (In-Memory / Postgres Abstracted)', type: 'PostgreSQL Abstracted' },
        cache: { status: 'HEALTHY (Memory / Redis Abstracted)', type: 'Memory/Redis' },
        storage: { status: 'HEALTHY (GCS Abstracted)', type: 'Google Cloud Storage' },
        queue: { status: 'HEALTHY (Worker Queue)', type: 'Internal Job Queue' }
      }
    };
  }
}
