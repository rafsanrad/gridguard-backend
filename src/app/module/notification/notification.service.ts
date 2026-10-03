import { IQueryParams } from "../../interfaces/common";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { getSafeSortField } from "../../utils/query";
import { ICreateNotificationPayload } from "./notification.interface";

const createNotification = async (payload: ICreateNotificationPayload) => {
  const user = await prisma.user.findFirst({
    where: {
      id: payload.userId,
      deletedAt: null,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const notification = await prisma.notification.create({
    data: {
      title: payload.title,
      message: payload.message,
      type: payload.type,
      userId: payload.userId,
    },
  });

  return notification;
};

const getAllNotifications = async (query?: IQueryParams) => {
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 10;
  const skip = (page - 1) * limit;

  const search = query?.search;
  const sortBy = query?.sortBy;
  const sortOrder = query?.sortOrder ?? "desc";

  const safeSortBy = getSafeSortField(
    sortBy,
    ["title", "type", "isRead", "createdAt", "updatedAt"],
    "createdAt",
  );

  const where = {
    user: {
      deletedAt: null,
    },

    ...(search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              message: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [notifications, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },

      orderBy: {
        [safeSortBy]: sortOrder,
      },
    }),

    prisma.notification.count({
      where,
    }),
  ]);

  return {
    data: notifications,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSingleNotification = async (
  id: string,
  userId?: string,
  userRole?: string,
) => {
  const notification = await prisma.notification.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!notification) {
    throw new AppError(404, "Notification not found");
  }

  if (userRole === "CUSTOMER" && notification.userId !== userId) {
    throw new AppError(403, "You can only access your own notification");
  }

  return notification;
};

const markNotificationAsRead = async (
  id: string,
  userId?: string,
  userRole?: string,
) => {
  const notification = await prisma.notification.findUnique({
    where: {
      id,
    },
  });

  if (!notification) {
    throw new AppError(404, "Notification not found");
  }

  if (userRole === "CUSTOMER" && notification.userId !== userId) {
    throw new AppError(403, "You can only update your own notification");
  }

  if (notification.isRead) {
    return notification;
  }

  return await prisma.notification.update({
    where: {
      id,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
};

export const NotificationService = {
  createNotification,
  getAllNotifications,
  getSingleNotification,
  markNotificationAsRead,
};
