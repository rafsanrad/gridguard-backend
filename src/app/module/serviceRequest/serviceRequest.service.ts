import { IQueryParams } from "../../interfaces/common";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { getSafeSortField } from "../../utils/query";
import { deleteCacheByPrefix, getCache, setCache } from "../../utils/cache";
import { AnalyticsService } from "../analytics/analytics.service";
import {
  ICreateServiceRequestPayload,
  IUpdateServiceRequestPayload,
} from "./serviceRequest.interface";

const createServiceRequest = async (
  payload: ICreateServiceRequestPayload,
  customerId: string,
) => {
  const customer = await prisma.user.findFirst({
    where: {
      id: customerId,
      deletedAt: null,
    },
  });

  if (!customer) {
    throw new AppError(404, "Customer not found");
  }

  if (customer.role !== "CUSTOMER") {
    throw new AppError(403, "Only customers can create service requests");
  }

  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      title: payload.title,
      description: payload.description,
      amount: payload.amount,
      customerId,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  await deleteCacheByPrefix("serviceRequests");
  await AnalyticsService.invalidateDashboardCache();

  return serviceRequest;
};

const getAllServiceRequests = async (query?: IQueryParams) => {
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 10;
  const skip = (page - 1) * limit;

  const search = query?.search ?? "";
  const sortBy = query?.sortBy ?? "";
  const sortOrder = query?.sortOrder ?? "desc";

  const cacheKey = `serviceRequests:${page}:${limit}:${search}:${sortBy}:${sortOrder}`;

  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const safeSortBy = getSafeSortField(
    sortBy,
    ["title", "status", "amount", "createdAt", "updatedAt", "completedAt"],
    "createdAt",
  );

  const where = {
    ...(search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              description: {
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
          ],
        }
      : {}),
  };

  const [serviceRequests, total] = await prisma.$transaction([
    prisma.serviceRequest.findMany({
      where,
      skip,
      take: limit,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        payments: true,
      },
      orderBy: {
        [safeSortBy]: sortOrder,
      },
    }),
    prisma.serviceRequest.count({ where }),
  ]);

  const result = {
    data: serviceRequests,
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

const getSingleServiceRequest = async (
  id: string,
  userId?: string,
  userRole?: string,
) => {
  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      payments: true,
    },
  });

  if (!serviceRequest) {
    throw new AppError(404, "Service request not found");
  }

  if (userRole === "CUSTOMER" && serviceRequest.customerId !== userId) {
    throw new AppError(403, "You can only access your own service request");
  }

  return serviceRequest;
};

const updateServiceRequest = async (
  id: string,
  payload: IUpdateServiceRequestPayload,
) => {
  const existingRequest = await prisma.serviceRequest.findUnique({
    where: { id },
  });

  if (!existingRequest) {
    throw new AppError(404, "Service request not found");
  }

  if (
    existingRequest.status === "COMPLETED" ||
    existingRequest.status === "CANCELLED" ||
    existingRequest.status === "REJECTED"
  ) {
    throw new AppError(
      400,
      `Cannot update a ${existingRequest.status.toLowerCase()} service request`,
    );
  }

  const updatedRequest = await prisma.serviceRequest.update({
    where: { id },
    data: payload,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  await deleteCacheByPrefix("serviceRequests");
  await AnalyticsService.invalidateDashboardCache();

  return updatedRequest;
};

export const ServiceRequestService = {
  createServiceRequest,
  getAllServiceRequests,
  getSingleServiceRequest,
  updateServiceRequest,
};
