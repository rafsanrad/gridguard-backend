import { prisma } from "../../lib/prisma";
import { IQueryParams } from "../../interfaces/common";
import { getSafeSortField } from "../../utils/query";
import { AppError } from "../../utils/AppError";
import { IUpdateUserPayload, IUpdateUserStatusPayload } from "./user.interface";

type IUserQueryParams = IQueryParams & {
  role?: "CUSTOMER" | "OPERATOR" | "ADMIN";
};

const getAllUsers = async (query?: IUserQueryParams) => {
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 10;
  const skip = (page - 1) * limit;

  const search = query?.search;
  const role = query?.role;
  const sortBy = query?.sortBy;
  const sortOrder = query?.sortOrder ?? "desc";

  const safeSortBy = getSafeSortField(
    sortBy,
    ["name", "email", "role", "status", "createdAt", "updatedAt"],
    "createdAt",
  );

  const where = {
    deletedAt: null,

    ...(role
      ? {
          role,
        }
      : {}),

    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              phone: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profilePhoto: true,
        gender: true,
        role: true,
        status: true,
        emailVerified: true,
        areaId: true,
        createdAt: true,
        updatedAt: true,
      },

      orderBy: {
        [safeSortBy]: sortOrder,
      },
    }),

    prisma.user.count({
      where,
    }),
  ]);

  return {
    data: users,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSingleUser = async (id: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id,
      deletedAt: null,
    },

    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      profilePhoto: true,
      gender: true,
      role: true,
      status: true,
      emailVerified: true,
      needPasswordChange: true,
      areaId: true,
      createdAt: true,
      updatedAt: true,

      area: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
};

const updateUserStatus = async (
  id: string,
  payload: IUpdateUserStatusPayload,
  actorId: string,
) => {
  const user = await prisma.user.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.id === actorId) {
    throw new AppError(400, "You cannot change your own account status");
  }

  if (user.status === "DELETED") {
    throw new AppError(400, "Deleted user cannot be activated or blocked");
  }

  if (user.status === payload.status) {
    throw new AppError(400, `User is already ${payload.status.toLowerCase()}`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: {
        id,
      },

      data: {
        status: payload.status,
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "STATUS_CHANGE",
        entity: "User",
        entityId: id,
        oldValues: {
          status: user.status,
        },
        newValues: {
          status: payload.status,
        },
        actorId,
      },
    });

    return updatedUser;
  });

  return result;
};

const updateUser = async (
  id: string,
  payload: IUpdateUserPayload,
  actorId: string,
) => {
  const user = await prisma.user.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.id === actorId) {
    throw new AppError(
      400,
      "You cannot update your own account through user management",
    );
  }

  if (payload.role === "ADMIN" && user.role !== "ADMIN") {
    // Admin role assignment is allowed here.
    // You can restrict this later if your business rules require it.
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    const result = await tx.user.update({
      where: {
        id,
      },

      data: {
        name: payload.name,
        phone: payload.phone,
        gender: payload.gender,
        role: payload.role,
      },

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profilePhoto: true,
        gender: true,
        role: true,
        status: true,
        emailVerified: true,
        areaId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "User",
        entityId: id,
        oldValues: {
          name: user.name,
          phone: user.phone,
          gender: user.gender,
          role: user.role,
        },
        newValues: {
          name: payload.name ?? user.name,
          phone: payload.phone ?? user.phone,
          gender: payload.gender ?? user.gender,
          role: payload.role ?? user.role,
        },
        actorId,
      },
    });

    return result;
  });

  return updatedUser;
};

const deleteUser = async (id: string, actorId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.id === actorId) {
    throw new AppError(400, "You cannot delete your own account");
  }

  const deletedUser = await prisma.$transaction(async (tx) => {
    const result = await tx.user.update({
      where: {
        id,
      },

      data: {
        status: "DELETED",
        deletedAt: new Date(),
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        deletedAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "DELETE",
        entity: "User",
        entityId: id,
        oldValues: {
          status: user.status,
          deletedAt: user.deletedAt,
        },
        newValues: {
          status: "DELETED",
          deletedAt: result.deletedAt,
        },
        actorId,
      },
    });

    return result;
  });

  return deletedUser;
};

export const UserService = {
  getAllUsers,
  getSingleUser,
  updateUserStatus,
  updateUser,
  deleteUser,
};
