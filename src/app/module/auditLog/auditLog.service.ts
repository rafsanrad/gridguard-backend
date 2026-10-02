import { prisma } from "../../lib/prisma";
import { ICreateAuditLogPayload } from "./auditLog.interface";

const createAuditLog = async (payload: ICreateAuditLogPayload) => {
  return await prisma.auditLog.create({
    data: {
      action: payload.action,
      entity: payload.entity,
      entityId: payload.entityId,
      oldValues: payload.oldValues as any,
      newValues: payload.newValues as any,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
      actorId: payload.actorId,
    },
  });
};

const getAllAuditLogs = async () => {
  return await prisma.auditLog.findMany({
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const AuditLogService = {
  createAuditLog,
  getAllAuditLogs,
};
