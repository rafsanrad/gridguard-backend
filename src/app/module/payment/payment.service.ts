import { prisma } from "../../lib/prisma";
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

const createPayment = async (
  payload: ICreatePaymentPayload,
  customerId: string,
) => {
  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id: payload.serviceRequestId },
  });

  if (!serviceRequest) {
    throw new AppError(404, "Service request not found");
  }

  if (serviceRequest.customerId !== customerId) {
    throw new AppError(
      403,
      "This service request does not belong to the customer",
    );
  }

  if (serviceRequest.status !== "PENDING") {
    throw new AppError(
      400,
      "Payment can only be created for a pending service request",
    );
  }

  const existingPayment = await prisma.payment.findFirst({
    where: {
      serviceRequestId: payload.serviceRequestId,
      status: "PENDING",
    },
  });

  if (existingPayment) {
    throw new AppError(
      409,
      "A pending payment already exists for this service request",
    );
  }

  const merchantInvoiceNumber = `GRIDGUARD-${Date.now()}`;
  const bkashIdToken = await getBkashIdToken();

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

  const bkashResponse = await response.json();

  if (!response.ok || !bkashResponse.paymentID) {
    throw new AppError(
      502,
      bkashResponse.statusMessage || "Failed to create bKash payment",
    );
  }

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

  await invalidatePaymentCaches();

  return {
    payment,
    paymentID: bkashResponse.paymentID,
    checkoutUrl: bkashResponse.bkashURL,
  };
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

const createStripePayment = async (
  payload: ICreatePaymentPayload,
  customerId: string,
) => {
  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id: payload.serviceRequestId },
  });

  if (!serviceRequest) {
    throw new AppError(404, "Service request not found");
  }

  if (serviceRequest.customerId !== customerId) {
    throw new AppError(
      403,
      "This service request does not belong to the customer",
    );
  }

  if (serviceRequest.status !== "PENDING") {
    throw new AppError(
      400,
      "Payment can only be created for a pending service request",
    );
  }

  const existingPayment = await prisma.payment.findFirst({
    where: {
      serviceRequestId: payload.serviceRequestId,
      status: "PENDING",
    },
  });

  if (existingPayment) {
    throw new AppError(
      409,
      "A pending payment already exists for this service request",
    );
  }

  const merchantInvoiceNumber = `GRIDGUARD-STRIPE-${Date.now()}`;

  const amount = Math.round(Number(serviceRequest.amount) * 100);

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new AppError(400, "Invalid payment amount");
  }

  // Create a pending payment in our database first.
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
    // Create Stripe Checkout Session.
    const session = await stripe.checkout.sessions.create({
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

      success_url: `${config.frontend_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.frontend_url}/payment/cancel`,
    });

    if (!session.url) {
      throw new Error("Stripe Checkout URL was not generated");
    }

    // Save Stripe session information.
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId: session.id,
        checkoutUrl: session.url,
      },
    });

    await invalidatePaymentCaches();

    return {
      payment: updatedPayment,
      sessionId: session.id,
      checkoutUrl: session.url,
    };
  } catch (error) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        failureReason:
          error instanceof Error
            ? error.message
            : "Stripe Checkout session creation failed",
      },
    });

    await invalidatePaymentCaches();

    throw new AppError(502, "Failed to create Stripe Checkout session");
  }
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

export const PaymentService = {
  createPayment,
  createStripePayment,
  handleStripeWebhook,
  reconcileStripePayment,
  executePayment,
  getAllPayments,
  getMyPayments,
  getSinglePayment,
};
