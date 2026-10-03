import { IQueryParams } from "../../interfaces/common";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { getSafeSortField } from "../../utils/query";
import { ICreateOutageReportPayload } from "./outageReport.interface";

const createOutageReport = async (
  payload: ICreateOutageReportPayload,
  customerId: string,
) => {
  // Check whether the customer exists
  const customer = await prisma.user.findFirst({
    where: {
      id: customerId,
      deletedAt: null,
    },
  });

  if (!customer) {
    throw new AppError(404, "Customer not found");
  }

  // Checked whether the user is actually a customer
  if (customer.role !== "CUSTOMER") {
    throw new AppError(403, "Only customers can report outages");
  }

  // If an outage ID is provided, verify the outage exists
  if (payload.outageId) {
    const outage = await prisma.outage.findFirst({
      where: {
        id: payload.outageId,
        deletedAt: null,
      },
    });

    if (!outage) {
      throw new AppError(404, "Outage not found");
    }
  }

  // Prevent duplicate reports from the same customer
  // for the same outage
  if (payload.outageId) {
    const existingReport = await prisma.outageReport.findFirst({
      where: {
        customerId: customerId,
        outageId: payload.outageId,
      },
    });

    if (existingReport) {
      throw new AppError(409, "You have already reported this outage");
    }
  }

  // Create the outage report
  const report = await prisma.outageReport.create({
    data: {
      description: payload.description,
      location: payload.location,
      customerId: customerId,
      outageId: payload.outageId,
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

      outage: true,
    },
  });

  return report;
};

const getAllOutageReports = async (query?: IQueryParams) => {
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 10;
  const skip = (page - 1) * limit;

  const search = query?.search;
  const sortBy = query?.sortBy;
  const sortOrder = query?.sortOrder ?? "desc";

  const safeSortBy = getSafeSortField(
    sortBy,
    ["reportedAt", "createdAt", "updatedAt"],
    "createdAt",
  );

  const where = {
    ...(search
      ? {
          OR: [
            {
              description: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              location: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [reports, total] = await prisma.$transaction([
    prisma.outageReport.findMany({
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

        outage: true,
      },

      orderBy: {
        [safeSortBy]: sortOrder,
      },
    }),

    prisma.outageReport.count({
      where,
    }),
  ]);

  return {
    data: reports,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSingleOutageReport = async (
  id: string,
  userId?: string,
  userRole?: string,
) => {
  const report = await prisma.outageReport.findUnique({
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
      outage: true,
    },
  });

  if (!report) {
    throw new AppError(404, "Outage report not found");
  }

  if (userRole === "CUSTOMER" && report.customerId !== userId) {
    throw new AppError(403, "You can only access your own outage report");
  }

  return report;
};

export const OutageReportService = {
  createOutageReport,
  getAllOutageReports,
  getSingleOutageReport,
};
