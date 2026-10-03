import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ServiceRequestService } from "./serviceRequest.service";

const createServiceRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceRequestService.createServiceRequest(
    req.body,
    req.user?.userId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Service request created successfully",
    data: result,
  });
});

const getAllServiceRequests = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ServiceRequestService.getAllServiceRequests(
      req.validatedQuery,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Service requests fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getSingleServiceRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ServiceRequestService.getSingleServiceRequest(
      req.params.id as string,
      req.user?.userId,
      req.user?.role,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Service request retrieved successfully",
      data: result,
    });
  },
);

const updateServiceRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceRequestService.updateServiceRequest(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Service request updated successfully",
    data: result,
  });
});

export const ServiceRequestController = {
  createServiceRequest,
  getAllServiceRequests,
  getSingleServiceRequest,
  updateServiceRequest,
};
