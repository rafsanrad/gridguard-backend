import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
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

const getAllNotifications = async () => {
  const notifications = await prisma.notification.findMany({
    where: {
      user: {
        deletedAt: null,
      },
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
    orderBy: {
      createdAt: "desc",
    },
  });

  return notifications;
};

const getSingleNotification = async (id: string) => {
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

  return notification;
};

const markNotificationAsRead = async (id: string) => {
  const notification = await prisma.notification.findUnique({
    where: {
      id,
    },
  });

  if (!notification) {
    throw new AppError(404, "Notification not found");
  }

  if (notification.isRead) {
    return notification;
  }

  const updatedNotification = await prisma.notification.update({
    where: {
      id,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return updatedNotification;
};

export const NotificationService = {
  createNotification,
  getAllNotifications,
  getSingleNotification,
  markNotificationAsRead,
};
