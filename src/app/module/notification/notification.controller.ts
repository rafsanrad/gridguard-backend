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

const getAllNotifications = catchAsync(async (_req: Request, res: Response) => {
  const result = await NotificationService.getAllNotifications();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notifications fetched successfully",
    data: result,
  });
});

const getSingleNotification = catchAsync(
  async (req: Request, res: Response) => {
    const result = await NotificationService.getSingleNotification(
      req.params.id as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Notification fetched successfully",
      data: result,
    });
  },
);

const markNotificationAsRead = catchAsync(
  async (req: Request, res: Response) => {
    const result = await NotificationService.markNotificationAsRead(
      req.params.id as string,
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
