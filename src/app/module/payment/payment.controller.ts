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

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getMyPayments(
    req.user!.userId,
    req.validatedQuery,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your payment history fetched successfully",
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

  if (typeof paymentID !== "string" || !paymentID.trim()) {
    throw new AppError(httpStatus.BAD_REQUEST, "Valid payment ID is required");
  }

  const frontendUrl = (config.frontend_url ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );

  // Check the payment against bKash before acting
  const verification = await PaymentService.verifyBkashPaymentStatus(paymentID);

  // A completed payment should never be cancelled based
  // on a browser callback's status query parameter.
  if (verification.payment.status === "SUCCESS") {
    return res.redirect(303, `${frontendUrl}/payment/success?provider=bkash`);
  }

  // The provider reports the transaction as completed.
  // Do not execute it again or mark it cancelled.
  // It must be reconciled using the verified provider data.
  if (verification.transactionStatus === "Completed") {
    throw new AppError(
      httpStatus.CONFLICT,
      "bKash transaction is completed and requires reconciliation",
    );
  }

  // The customer returned from checkout without success.
  // Do not assume the payment is definitively cancelled.
  if (status === "cancel" || status === "failure") {
    return res.redirect(303, `${frontendUrl}/payment/cancel?provider=bkash`);
  }

  if (status !== "success") {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid bKash callback status");
  }

  // Only attempt execution for a payment that is still
  // locally pending and not reported as completed.
  if (verification.payment.status !== "PENDING") {
    throw new AppError(
      httpStatus.CONFLICT,
      "This payment is no longer pending",
    );
  }

  const payment = await PaymentService.executePayment(paymentID);

  if (payment.status !== "SUCCESS") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "bKash payment could not be confirmed",
    );
  }

  return res.redirect(303, `${frontendUrl}/payment/success?provider=bkash`);
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
  getMyPayments,
  getSinglePayment,
  bkashCallback,
};
