import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { getBkashIdToken } from "../../lib/bkash";
import config from "../../config";
import { ICreatePaymentPayload } from "./payment.interface";
import { getSafeSortField } from "../../utils/query";
import { IQueryParams } from "../../interfaces/common";

const createPayment = async (
  payload: ICreatePaymentPayload,
  customerId: string,
) => {
  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: {
      id: payload.serviceRequestId,
    },
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

  // Get bKash ID token from Redis/cache.
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
      customerId: customerId,
      serviceRequestId: payload.serviceRequestId,
    },
  });

  return {
    payment,
    paymentID: bkashResponse.paymentID,
    checkoutUrl: bkashResponse.bkashURL,
  };
};

const executePayment = async (paymentID: string) => {
  const payment = await prisma.payment.findFirst({
    where: {
      providerPaymentId: paymentID,
    },
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

      body: JSON.stringify({
        paymentID,
      }),
    },
  );

  const bkashResponse = await response.json();

  if (!response.ok || bkashResponse.statusCode !== "0000") {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: "FAILED",
        failureReason:
          bkashResponse.statusMessage || "bKash payment execution failed",
      },
    });

    throw new AppError(
      400,
      bkashResponse.statusMessage || "bKash payment execution failed",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: "SUCCESS",
        transactionId: bkashResponse.trxID,
        paidAt: new Date(),
      },
    });

    await tx.serviceRequest.update({
      where: {
        id: payment.serviceRequestId,
      },
      data: {
        status: "APPROVED",
      },
    });

    await tx.auditLog.create({
      data: {
        action: "PAYMENT",
        entity: "Payment",
        entityId: payment.id,

        oldValues: {
          status: "PENDING",
        },

        newValues: {
          status: "SUCCESS",
          transactionId: bkashResponse.trxID,
        },

        actorId: payment.customerId,
      },
    });

    return updatedPayment;
  });

  return result;
};

const getAllPayments = async (query?: IQueryParams) => {
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 10;
  const skip = (page - 1) * limit;

  const search = query?.search;
  const sortBy = query?.sortBy;
  const sortOrder = query?.sortOrder ?? "desc";

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

      orderBy: {
        [safeSortBy]: sortOrder,
      },
    }),

    prisma.payment.count({
      where,
    }),
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
    where: {
      id,
    },
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

export const PaymentService = {
  createPayment,
  executePayment,
  getAllPayments,
  getSinglePayment,
};
