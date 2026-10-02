import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICreateOutageReportPayload } from "./outageReport.interface";

const createOutageReport = async (payload: ICreateOutageReportPayload) => {
  // Check whether the customer exists
  const customer = await prisma.user.findFirst({
    where: {
      id: payload.customerId,
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
        customerId: payload.customerId,
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
      customerId: payload.customerId,
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

const getAllOutageReports = async () => {
  const reports = await prisma.outageReport.findMany({
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
      createdAt: "desc",
    },
  });

  return reports;
};

const getSingleOutageReport = async (id: string) => {
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

  return report;
};

export const OutageReportService = {
  createOutageReport,
  getAllOutageReports,
  getSingleOutageReport,
};
