import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
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
      customerId: customerId,
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

  return serviceRequest;
};

const getAllServiceRequests = async () => {
  const serviceRequests = await prisma.serviceRequest.findMany({
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
      createdAt: "desc",
    },
  });

  return serviceRequests;
};

const getSingleServiceRequest = async (
  id: string,
  userId?: string,
  userRole?: string,
) => {
  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: {
      id,
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
    where: {
      id,
    },
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
    where: {
      id,
    },
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

  return updatedRequest;
};

export const ServiceRequestService = {
  createServiceRequest,
  getAllServiceRequests,
  getSingleServiceRequest,
  updateServiceRequest,
};
