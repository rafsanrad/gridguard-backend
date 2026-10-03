import { IQueryParams } from "../../interfaces/common";
import { prisma } from "../../lib/prisma";
import { getSafeSortField } from "../../utils/query";
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

const getAllAuditLogs = async (query?: IQueryParams) => {
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 10;
  const skip = (page - 1) * limit;

  const search = query?.search;
  const sortBy = query?.sortBy;
  const sortOrder = query?.sortOrder ?? "desc";

  const safeSortBy = getSafeSortField(
    sortBy,
    ["action", "entity", "entityId", "createdAt"],
    "createdAt",
  );

  const where = {
    ...(search
      ? {
          OR: [
            {
              entity: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              entityId: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              actor: {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              actor: {
                email: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  };

  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,

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
        [safeSortBy]: sortOrder,
      },
    }),

    prisma.auditLog.count({
      where,
    }),
  ]);

  return {
    data: logs,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const AuditLogService = {
  createAuditLog,
  getAllAuditLogs,
};
