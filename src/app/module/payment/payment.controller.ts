import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PaymentService } from "./payment.service";
import { AppError } from "../../utils/AppError";

const createPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.createPayment(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "bKash payment created successfully",
    data: result,
  });
});

const executePayment = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.executePayment(req.body.paymentID);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment completed successfully",
    data: result,
  });
});

const bkashCallback = catchAsync(async (req: Request, res: Response) => {
  const { paymentID, status } = req.query;

  if (!paymentID) {
    throw new AppError(httpStatus.BAD_REQUEST, "Payment ID is required");
  }

  if (status === "cancel") {
    return res.status(httpStatus.OK).json({
      success: false,
      statusCode: httpStatus.OK,
      message: "bKash payment was cancelled",
    });
  }

  if (status === "failure") {
    return res.status(httpStatus.OK).json({
      success: false,
      statusCode: httpStatus.OK,
      message: "bKash payment failed",
    });
  }

  const result = await PaymentService.executePayment(paymentID as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "bKash payment completed successfully",
    data: result,
  });
});

export const PaymentController = {
  createPayment,
  executePayment,
  bkashCallback
};
