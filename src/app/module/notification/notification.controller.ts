import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { NotificationService } from "./notification.service";

const createNotification = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.createNotification(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Notification created successfully",
    data: result,
  });
});

const getAllNotifications = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.getAllNotifications(req.validatedQuery);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notifications fetched successfully",
    data: result.data,
    meta: result.meta
  });
});

const getSingleNotification = catchAsync(
  async (req: Request, res: Response) => {
    const result = await NotificationService.getSingleNotification(
      req.params.id as string,
      req.user?.userId,
      req.user?.role,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Notification retrieved successfully",
      data: result,
    });
  },
);

const markNotificationAsRead = catchAsync(
  async (req: Request, res: Response) => {
    const result = await NotificationService.markNotificationAsRead(
      req.params.id as string,
      req.user?.userId,
      req.user?.role,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Notification marked as read",
      data: result,
    });
  },
);

export const NotificationController = {
  createNotification,
  getAllNotifications,
  getSingleNotification,
  markNotificationAsRead,
};
