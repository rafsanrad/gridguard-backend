import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PaymentService } from "./payment.service";
import { AppError } from "../../utils/AppError";
import Stripe from "stripe";
import { stripe } from "../../lib/stripe";
import config from "../../config";

const createPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.createPayment(
    req.body,
    req.user?.userId as string,
  );

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

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getAllPayments(req.validatedQuery);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payments retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getSinglePayment = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getSinglePayment(
    req.params.id as string,
    req.user?.userId,
    req.user?.role,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment retrieved successfully",
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

const createStripePayment = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.createStripePayment(
    req.body,
    req.user?.userId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Stripe payment created successfully",
    data: result,
  });
});

const stripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];

  if (!signature || typeof signature !== "string") {
    return res.status(400).send("Missing Stripe signature");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      config.stripe_webhook_secret,
    );
  } catch (error) {
    return res
      .status(400)
      .send(
        `Webhook signature verification failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;

      await PaymentService.handleStripeWebhook(event.type, session);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed:", error);

    return res.status(500).json({
      success: false,
      message: "Stripe webhook processing failed",
    });
  }
};

export const PaymentController = {
  createPayment,
  createStripePayment,
  stripeWebhook,
  executePayment,
  getAllPayments,
  getSinglePayment,
  bkashCallback,
};
