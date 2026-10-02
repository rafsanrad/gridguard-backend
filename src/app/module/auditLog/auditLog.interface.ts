import { AuditAction } from "../../../generated/prisma/enums";

export interface ICreateAuditLogPayload {
  action: AuditAction;
  entity: string;
  entityId: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
  userAgent?: string;
  actorId?: string;
}