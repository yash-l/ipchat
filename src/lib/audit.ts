import { db } from "./db";

interface AuditParams {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Writes an immutable audit log row. Call this for EVERY admin action that
 * reads or exports user data — bans, data exports, request approvals, etc.
 * There is deliberately no "delete audit log" pathway exposed anywhere.
 */
export async function writeAuditLog(params: AuditParams) {
  await db.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined
    }
  });
}
