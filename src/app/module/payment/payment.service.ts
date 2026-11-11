import { prisma } from "../../lib/prisma";
import { randomUUID } from "node:crypto";
import { AppError } from "../../utils/AppError";
import { getBkashIdToken } from "../../lib/bkash";
import config from "../../config";
import { ICreatePaymentPayload } from "./payment.interface";
import { getSafeSortField } from "../../utils/query";
import { IQueryParams } from "../../interfaces/common";
import { deleteCacheByPrefix, getCache, setCache } from "../../utils/cache";
import { AnalyticsService } from "../analytics/analytics.service";
import { stripe } from "../../lib/stripe";
import Stripe from "stripe";

const invalidatePaymentCaches = async () => {
  await Promise.all([
    deleteCacheByPrefix("payments"),
    deleteCacheByPrefix("serviceRequests"),
    deleteCacheByPrefix("auditLogs"),
    AnalyticsService.invalidateDashboardCache(),
  ]);
};

const getExistingPendingPayment = async (serviceRequestId: string) => {
  return prisma.payment.findFirst({
    where: {
      serviceRequestId,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const createPayment = async (
  payload: ICreatePaymentPayload,
  customerId: string,
) => {
  console.log("🔥 BKASH CREATE PAYMENT FUNCTION CALLED");
  // 1. Find the service request
  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: {
      id: payload.serviceRequestId,
    },
  });

  if (!serviceRequest) {
    throw new AppError(404, "Service request not found");
  }

  // 2. Verify service request ownership
  if (serviceRequest.customerId !== customerId) {
    throw new AppError(
      403,
      "This service request does not belong to the customer",
    );
  }

  // 3. Only pending service requests can be paid
  if (serviceRequest.status !== "PENDING") {
    throw new AppError(
      400,
      "Payment can only be created for a pending service request",
    );
  }

  // 4. Check for an existing pending payment
  const existingPayment = await getExistingPendingPayment(
    payload.serviceRequestId,
  );

  if (existingPayment) {
    // Do not switch providers while Stripe payment is pending
    if (existingPayment.provider !== "BKASH") {
      throw new AppError(
        409,
        "A pending Stripe payment already exists. Resolve it before using bKash.",
      );
    }

    // Verify that the existing payment has a provider ID
    if (!existingPayment.providerPaymentId) {
      throw new AppError(
        409,
        "Existing bKash payment is missing its payment ID",
      );
    }

    // 5. Reconcile the existing payment with bKash
    const reconciliation = await reconcileBkashPayment(
      existingPayment.providerPaymentId,
    );

    // Already paid
    if (reconciliation.status === "SUCCESS") {
      throw new AppError(409, "This service request has already been paid");
    }

    // Provider reports a completed transaction
    if (reconciliation.status === "REQUIRES_RECONCILIATION") {
      throw new AppError(409, "Previous bKash payment requires reconciliation");
    }

    // Provider status could not be determined
    if (reconciliation.status === "UNKNOWN") {
      throw new AppError(
        409,
        "Unable to confirm the previous bKash payment status",
      );
    }

    // Existing payment is still pending
    if (reconciliation.status === "PENDING") {
      if (!existingPayment.checkoutUrl) {
        throw new AppError(409, "Existing bKash checkout URL is unavailable");
      }

      return {
        payment: existingPayment,
        paymentID: existingPayment.providerPaymentId,
        checkoutUrl: existingPayment.checkoutUrl,
      };
    }

    // Never create another checkout for an unresolved payment
    throw new AppError(409, "Existing bKash payment could not be resolved");
  }

  // 6. Generate unique merchant invoice number
  const merchantInvoiceNumber = `GRIDGUARD-${randomUUID()}`;

  // 7. Get bKash authentication token
  const bkashIdToken = await getBkashIdToken();

  // 8. Create a new bKash checkout
  const response = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: bkashIdToken,
        "X-APP-Key": config.bkash_app_key,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: customerId,
        callbackURL: config.bkash_callback_url,
        amount: serviceRequest.amount.toString(),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber,
      }),
    },
  );

  // 9. Parse bKash response
  const bkashResponse = await response.json();

  console.log("bKash create response:", {
    httpStatus: response.status,
    statusCode: bkashResponse.statusCode,
    statusMessage: bkashResponse.statusMessage,
    hasPaymentID: Boolean(bkashResponse.paymentID),
    hasCheckoutUrl: Boolean(bkashResponse.bkashURL),
  });

  console.log("bKash checkout details:", {
    statusCode: bkashResponse.statusCode,
    paymentIDExists: Boolean(bkashResponse.paymentID),
    checkoutHost: bkashResponse.bkashURL
      ? new URL(bkashResponse.bkashURL).hostname
      : null,
  });

  // 10. Validate bKash response
  if (!response.ok || !bkashResponse.paymentID || !bkashResponse.bkashURL) {
    throw new AppError(
      502,
      bkashResponse.statusMessage || "Failed to create bKash payment",
    );
  }

  // 11. Save payment in PostgreSQL
  const payment = await prisma.payment.create({
    data: {
      merchantInvoiceNumber,
      amount: serviceRequest.amount,
      currency: "BDT",
      provider: "BKASH",
      status: "PENDING",
      providerPaymentId: bkashResponse.paymentID,
      checkoutUrl: bkashResponse.bkashURL,
      customerId,
      serviceRequestId: payload.serviceRequestId,
    },
  });

  // 12. Invalidate related caches
  await invalidatePaymentCaches();

  // 13. Return checkout information
  return {
    payment,
    paymentID: bkashResponse.paymentID,
    checkoutUrl: bkashResponse.bkashURL,
  };
};

const createStripePayment = async (
  payload: ICreatePaymentPayload,
  customerId: string,
) => {
  // 1. Find the service request
  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id: payload.serviceRequestId },
  });

  if (!serviceRequest) {
    throw new AppError(404, "Service request not found");
  }

  // 2. Verify ownership
  if (serviceRequest.customerId !== customerId) {
    throw new AppError(
      403,
      "This service request does not belong to the customer",
    );
  }

  // 3. Only pending service requests can be paid
  if (serviceRequest.status !== "PENDING") {
    throw new AppError(
      400,
      "Payment can only be created for a pending service request",
    );
  }

  // 4. Check for an existing pending payment
  const existingPayment = await getExistingPendingPayment(
    payload.serviceRequestId,
  );

  if (existingPayment) {
    if (existingPayment.provider !== "STRIPE") {
      throw new AppError(
        409,
        "A pending bKash payment already exists. Resolve it before using Stripe.",
      );
    }

    // Recover or inspect the existing Stripe checkout
    const result = await resolveExistingStripePayment(existingPayment.id);

    // Resume an existing or recovered checkout
    if (result.status === "PENDING") {
      if (!result.checkoutUrl || !result.sessionId) {
        throw new AppError(
          409,
          "Existing Stripe checkout is temporarily unavailable",
        );
      }

      const updatedPayment = await prisma.payment.findUniqueOrThrow({
        where: { id: existingPayment.id },
      });

      return {
        payment: updatedPayment,
        sessionId: result.sessionId,
        checkoutUrl: result.checkoutUrl,
      };
    }

    // Prevent duplicate payment
    if (result.status === "SUCCESS") {
      throw new AppError(409, "This service request has already been paid");
    }

    // If the previous session expired, the resolver marks it
    // CANCELLED and we can create a new checkout below.
    if (result.status !== "CANCELLED") {
      throw new AppError(
        409,
        "Existing Stripe payment requires reconciliation",
      );
    }
  }

  // 5. Generate a unique invoice number
  const merchantInvoiceNumber = `GRIDGUARD-STRIPE-${randomUUID()}`;

  // 6. Convert BDT to the smallest currency unit
  const amount = Math.round(Number(serviceRequest.amount) * 100);

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new AppError(400, "Invalid payment amount");
  }

  // 7. Create pending payment record
  const payment = await prisma.payment.create({
    data: {
      merchantInvoiceNumber,
      amount: serviceRequest.amount,
      currency: "BDT",
      provider: "STRIPE",
      status: "PENDING",
      customerId,
      serviceRequestId: payload.serviceRequestId,
    },
  });

  try {
    // 8. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",

        line_items: [
          {
            price_data: {
              currency: "bdt",
              product_data: {
                name: serviceRequest.title,
                description: "GridGuard Service Request Payment",
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],

        metadata: {
          paymentId: payment.id,
          merchantInvoiceNumber,
          serviceRequestId: payload.serviceRequestId,
          customerId,
        },

        success_url:
          `${config.frontend_url}/payment/success` +
          "?session_id={CHECKOUT_SESSION_ID}",

        cancel_url: `${config.frontend_url}/payment/cancel`,
      },
      {
        // Same key is used when recovering this payment.
        idempotencyKey: `gridguard-stripe-checkout-${payment.id}`,
      },
    );

    if (!session.url) {
      throw new Error("Stripe Checkout URL was not generated");
    }

    // 9. Save Stripe Checkout Session information
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId: session.id,
        checkoutUrl: session.url,
        failureReason: null,
      },
    });

    // 10. Invalidate payment-related caches
    await invalidatePaymentCaches();

    // 11. Return checkout information
    return {
      payment: updatedPayment,
      sessionId: session.id,
      checkoutUrl: session.url,
    };
  } catch (error) {
    console.error("Stripe checkout initialization error:", error);

    // Do not mark the payment FAILED automatically.
    // Stripe might have created a session even if saving it failed.
    const currentPayment = await prisma.payment.findUnique({
      where: { id: payment.id },
    });

    if (
      currentPayment?.status === "PENDING" &&
      !currentPayment.providerPaymentId
    ) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          failureReason:
            error instanceof Error
              ? error.message
              : "Stripe checkout initialization needs reconciliation",
        },
      });
    }

    await invalidatePaymentCaches();

    throw new AppError(
      502,
      "Stripe checkout could not be prepared. Please retry later.",
    );
  }
};

const executePayment = async (paymentID: string) => {
  const payment = await prisma.payment.findFirst({
    where: { providerPaymentId: paymentID },
  });

  if (!payment) {
    throw new AppError(404, "Payment not found");
  }

  if (payment.status === "SUCCESS") {
    return payment;
  }

  const bkashIdToken = await getBkashIdToken();

  const response = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/execute`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: bkashIdToken,
        "X-APP-Key": config.bkash_app_key,
      },
      body: JSON.stringify({ paymentID }),
    },
  );

  const bkashResponse = await response.json();

  if (!response.ok || bkashResponse.statusCode !== "0000") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        failureReason:
          bkashResponse.statusMessage || "bKash payment execution failed",
      },
    });

    await invalidatePaymentCaches();

    throw new AppError(
      400,
      bkashResponse.statusMessage || "bKash payment execution failed",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        transactionId: bkashResponse.trxID,
        paidAt: new Date(),
      },
    });

    const updatedServiceRequest = await tx.serviceRequest.update({
      where: { id: payment.serviceRequestId },
      data: { status: "APPROVED" },
    });

    await tx.auditLog.create({
      data: {
        action: "PAYMENT",
        entity: "Payment",
        entityId: payment.id,
        oldValues: { status: "PENDING" },
        newValues: {
          status: "SUCCESS",
          transactionId: bkashResponse.trxID,
        },
        actorId: payment.customerId,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "STATUS_CHANGE",
        entity: "ServiceRequest",
        entityId: payment.serviceRequestId,
        oldValues: { status: "PENDING" },
        newValues: { status: updatedServiceRequest.status },
        actorId: payment.customerId,
      },
    });

    return updatedPayment;
  });

  await invalidatePaymentCaches();

  return result;
};

const getAllPayments = async (query?: IQueryParams) => {
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 10;
  const skip = (page - 1) * limit;

  const search = query?.search ?? "";
  const sortBy = query?.sortBy ?? "";
  const sortOrder = query?.sortOrder ?? "desc";

  const cacheKey = `payments:${page}:${limit}:${search}:${sortBy}:${sortOrder}`;
  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const safeSortBy = getSafeSortField(
    sortBy,
    [
      "merchantInvoiceNumber",
      "amount",
      "currency",
      "provider",
      "status",
      "transactionId",
      "paidAt",
      "createdAt",
      "updatedAt",
    ],
    "createdAt",
  );

  const where = {
    ...(search
      ? {
          OR: [
            {
              merchantInvoiceNumber: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              transactionId: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              customer: {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              customer: {
                email: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              serviceRequest: {
                title: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  };

  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        serviceRequest: {
          select: {
            id: true,
            title: true,
            status: true,
            amount: true,
          },
        },
      },
      orderBy: { [safeSortBy]: sortOrder },
    }),
    prisma.payment.count({ where }),
  ]);

  const result = {
    data: payments,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };

  await setCache(cacheKey, result, 300);

  return result;
};

const getMyPayments = async (customerId: string, query?: IQueryParams) => {
  const page = Math.max(1, query?.page ?? 1);
  const limit = Math.max(1, Math.min(query?.limit ?? 10, 100));
  const skip = (page - 1) * limit;

  const search = query?.search ?? "";
  const sortBy = query?.sortBy ?? "";
  const sortOrder = query?.sortOrder ?? "desc";

  const safeSortBy = getSafeSortField(
    sortBy,
    [
      "merchantInvoiceNumber",
      "amount",
      "currency",
      "provider",
      "status",
      "paidAt",
      "createdAt",
      "updatedAt",
    ],
    "createdAt",
  );

  const where = {
    customerId,
    ...(search
      ? {
          OR: [
            {
              merchantInvoiceNumber: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              serviceRequest: {
                title: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  };

  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [safeSortBy]: sortOrder,
      },
      select: {
        id: true,
        merchantInvoiceNumber: true,
        amount: true,
        currency: true,
        provider: true,
        status: true,
        transactionId: true,
        paidAt: true,
        createdAt: true,
        updatedAt: true,
        serviceRequest: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    data: payments,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSinglePayment = async (
  id: string,
  userId?: string,
  userRole?: string,
) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      serviceRequest: {
        select: {
          id: true,
          title: true,
          status: true,
          amount: true,
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(404, "Payment not found");
  }

  if (userRole === "CUSTOMER" && payment.customerId !== userId) {
    throw new AppError(403, "You can only access your own payment");
  }

  return payment;
};

const handleStripeWebhook = async (
  eventType: string,
  session: Stripe.Checkout.Session,
) => {
  const payment = await prisma.payment.findFirst({
    where: {
      providerPaymentId: session.id,
      provider: "STRIPE",
    },
  });

  if (!payment) {
    console.warn(
      `Ignoring Stripe webhook: no matching payment for session ${session.id}`,
    );

    return null;
  }

  // Handle successful payment
  if (
    eventType === "checkout.session.completed" ||
    eventType === "checkout.session.async_payment_succeeded"
  ) {
    if (payment.status === "SUCCESS") {
      return payment;
    }

    if (session.payment_status !== "paid") {
      return payment;
    }

    const transactionId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    const result = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCESS",
          transactionId,
          paidAt: new Date(),
        },
      });

      const updatedServiceRequest = await tx.serviceRequest.update({
        where: { id: payment.serviceRequestId },
        data: { status: "APPROVED" },
      });

      await tx.auditLog.create({
        data: {
          action: "PAYMENT",
          entity: "Payment",
          entityId: payment.id,
          oldValues: { status: "PENDING" },
          newValues: {
            status: "SUCCESS",
            transactionId,
          },
          actorId: payment.customerId,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "STATUS_CHANGE",
          entity: "ServiceRequest",
          entityId: payment.serviceRequestId,
          oldValues: { status: "PENDING" },
          newValues: {
            status: updatedServiceRequest.status,
          },
          actorId: payment.customerId,
        },
      });

      return updatedPayment;
    });

    await invalidatePaymentCaches();

    return result;
  }

  // Handle failed asynchronous payment
  if (eventType === "checkout.session.async_payment_failed") {
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        failureReason: "Stripe payment failed",
      },
    });

    await invalidatePaymentCaches();

    return updatedPayment;
  }

  return payment;
};

const reconcileStripePayment = async (paymentId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment || payment.provider !== "STRIPE") {
    throw new AppError(404, "Stripe payment not found");
  }

  if (!payment.providerPaymentId) {
    throw new AppError(400, "Stripe Checkout Session ID is missing");
  }

  const session = await stripe.checkout.sessions.retrieve(
    payment.providerPaymentId,
  );

  if (session.id !== payment.providerPaymentId) {
    throw new AppError(400, "Stripe Checkout Session mismatch");
  }

  if (session.payment_status !== "paid" || session.status !== "complete") {
    throw new AppError(400, "Stripe payment is not completed");
  }

  if (
    session.currency?.toUpperCase() !== payment.currency.toUpperCase() ||
    session.amount_total !== Math.round(Number(payment.amount) * 100)
  ) {
    throw new AppError(400, "Stripe payment amount or currency mismatch");
  }

  if (
    session.metadata?.paymentId !== payment.id ||
    session.metadata?.serviceRequestId !== payment.serviceRequestId ||
    session.metadata?.customerId !== payment.customerId
  ) {
    throw new AppError(400, "Stripe payment metadata mismatch");
  }

  return handleStripeWebhook("checkout.session.completed", session);
};

const resolveExistingStripePayment = async (paymentId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      serviceRequest: true,
    },
  });

  if (!payment || payment.provider !== "STRIPE") {
    throw new AppError(404, "Stripe payment not found");
  }

  if (payment.status !== "PENDING") {
    return {
      status: payment.status,
      checkoutUrl: null,
      sessionId: payment.providerPaymentId,
    };
  }

  // Recover a checkout that was never fully initialized.
  if (!payment.providerPaymentId) {
    const amount = Math.round(Number(payment.amount) * 100);

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new AppError(400, "Invalid payment amount");
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "bdt",
              product_data: {
                name: payment.serviceRequest.title,
                description: "GridGuard Service Request Payment",
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        metadata: {
          paymentId: payment.id,
          merchantInvoiceNumber: payment.merchantInvoiceNumber,
          serviceRequestId: payment.serviceRequestId,
          customerId: payment.customerId,
        },
        success_url:
          `${config.frontend_url}/payment/success` +
          "?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: `${config.frontend_url}/payment/cancel`,
      },
      {
        idempotencyKey: `gridguard-stripe-checkout-${payment.id}`,
      },
    );

    if (!session.url) {
      throw new AppError(502, "Stripe Checkout URL was not generated");
    }

    await prisma.payment.updateMany({
      where: {
        id: payment.id,
        status: "PENDING",
        providerPaymentId: null,
      },
      data: {
        providerPaymentId: session.id,
        checkoutUrl: session.url,
        failureReason: null,
      },
    });

    await invalidatePaymentCaches();

    return {
      status: "PENDING" as const,
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  const session = await stripe.checkout.sessions.retrieve(
    payment.providerPaymentId,
  );

  if (session.payment_status === "paid") {
    await reconcileStripePayment(payment.id);

    return {
      status: "SUCCESS" as const,
      checkoutUrl: null,
      sessionId: session.id,
    };
  }

  if (session.status === "open") {
    return {
      status: "PENDING" as const,
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  if (session.status === "expired") {
    await prisma.payment.updateMany({
      where: {
        id: payment.id,
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
        failureReason: "Stripe Checkout session expired",
      },
    });

    await invalidatePaymentCaches();

    return {
      status: "CANCELLED" as const,
      checkoutUrl: null,
      sessionId: session.id,
    };
  }

  throw new AppError(409, "Stripe payment is awaiting confirmation");
};

const cancelBkashPayment = async (paymentID: string) => {
  const payment = await prisma.payment.findFirst({
    where: {
      providerPaymentId: paymentID,
      provider: "BKASH",
    },
  });

  if (!payment) {
    throw new AppError(404, "bKash payment not found");
  }

  if (payment.status === "SUCCESS") {
    throw new AppError(409, "A successful payment cannot be cancelled");
  }

  if (payment.status !== "PENDING") {
    return payment;
  }

  const updatedPayment = await prisma.payment.update({
    where: {
      id: payment.id,
    },
    data: {
      status: "CANCELLED",
      failureReason: "bKash checkout cancelled",
    },
  });

  await invalidatePaymentCaches();

  return updatedPayment;
};

const verifyBkashPaymentStatus = async (paymentID: string) => {
  const payment = await prisma.payment.findFirst({
    where: {
      providerPaymentId: paymentID,
      provider: "BKASH",
    },
  });

  if (!payment) {
    throw new AppError(404, "bKash payment not found");
  }

  const idToken = await getBkashIdToken();

  const response = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/payment/status`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: idToken,
        "X-APP-Key": config.bkash_app_key,
      },
      body: JSON.stringify({ paymentID }),
    },
  );

  if (!response.ok) {
    throw new AppError(502, "Unable to query bKash payment status");
  }

  const result = await response.json();

  if (result.statusCode && result.statusCode !== "0000") {
    throw new AppError(
      502,
      result.statusMessage || "bKash payment query failed",
    );
  }

  if (result.paymentID !== paymentID) {
    throw new AppError(502, "bKash returned a mismatched payment ID");
  }

  return {
    payment,
    transactionStatus: result.transactionStatus,
    providerResponse: result,
  };
};

const reconcileBkashPayment = async (paymentID: string) => {
  // 1. Verify the payment against bKash
  const verification = await verifyBkashPaymentStatus(paymentID);

  const { payment, transactionStatus } = verification;

  // 2. Already successful in our database
  if (payment.status === "SUCCESS") {
    return {
      payment,
      status: "SUCCESS" as const,
    };
  }

  // 3. Provider reports a completed transaction
  if (transactionStatus === "Completed") {
    // Do not execute or charge again.
    // The completed transaction needs separate reconciliation
    // using verified provider details.
    return {
      payment,
      status: "REQUIRES_RECONCILIATION" as const,
    };
  }

  // 4. Transaction is still pending
  if (transactionStatus === "Initiated") {
    return {
      payment,
      status: "PENDING" as const,
    };
  }

  // 5. Unknown or unsupported status
  // Never assume this means the payment failed.
  return {
    payment,
    status: "UNKNOWN" as const,
  };
};

export const PaymentService = {
  createPayment,
  createStripePayment,
  handleStripeWebhook,
  reconcileStripePayment,
  resolveExistingStripePayment,
  executePayment,
  getAllPayments,
  getMyPayments,
  getSinglePayment,
  cancelBkashPayment,
  verifyBkashPaymentStatus,
  reconcileBkashPayment,
};
