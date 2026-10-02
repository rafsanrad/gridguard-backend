import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateOutagePayload,
  IUpdateOutagePayload,
  IUpdateOutageStatusPayload,
} from "./outage.interface";
import { OutageStatus } from "../../../generated/prisma/enums";

const createOutage = async (payload: ICreateOutagePayload) => {
  const feeder = await prisma.feeder.findUnique({
    where: {
      id: payload.feederId,
    },
  });

  if (!feeder) {
    throw new AppError(404, "Feeder not found");
  }

  if (!feeder.isActive) {
    throw new AppError(400, "Cannot create outage for an inactive feeder");
  }

  if (payload.reportedById) {
    const reporter = await prisma.user.findUnique({
      where: {
        id: payload.reportedById,
      },
    });

    if (!reporter) {
      throw new AppError(404, "Reporter not found");
    }
  }

  const outage = await prisma.outage.create({
    data: {
      title: payload.title,
      description: payload.description,
      type: payload.type,
      startedAt: payload.startedAt,
      estimatedRestoredAt: payload.estimatedRestoredAt,
      cause: payload.cause,
      affectedCustomers: payload.affectedCustomers,
      feederId: payload.feederId,
      reportedById: payload.reportedById,
    },
  });

  return outage;
};

const getAllOutages = async () => {
  const outages = await prisma.outage.findMany({
    where: {
      deletedAt: null,
    },

    include: {
      feeder: true,
      reportedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return outages;
};

const getSingleOutage = async (id: string) => {
  const outage = await prisma.outage.findFirst({
    where: {
      id,
      deletedAt: null,
    },

    include: {
      feeder: true,
      reportedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reports: true,
      assignments: {
        include: {
          technician: true,
        },
      },
    },
  });

  if (!outage) {
    throw new AppError(404, "Outage not found");
  }

  return outage;
};

const updateOutage = async (id: string, payload: IUpdateOutagePayload) => {
  const existingOutage = await prisma.outage.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!existingOutage) {
    throw new AppError(404, "Outage not found");
  }

  if (
    payload.estimatedRestoredAt &&
    payload.estimatedRestoredAt <= existingOutage.startedAt
  ) {
    throw new AppError(400, "Estimated restored time must be after start time");
  }

  const updatedOutage = await prisma.outage.update({
    where: {
      id,
    },

    data: payload,
  });

  return updatedOutage;
};

const updateOutageStatus = async (
  id: string,
  payload: IUpdateOutageStatusPayload,
) => {
  const outage = await prisma.outage.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!outage) {
    throw new AppError(404, "Outage not found");
  }

  //Transitions serial can not break.
  const allowedTransitions: Record<OutageStatus, OutageStatus[]> = {
    REPORTED: [OutageStatus.ACKNOWLEDGED],
    ACKNOWLEDGED: [OutageStatus.ASSIGNED],
    ASSIGNED: [OutageStatus.INVESTIGATING],
    INVESTIGATING: [OutageStatus.REPAIRING],
    REPAIRING: [OutageStatus.RESTORED],
    RESTORED: [OutageStatus.CLOSED],
    CLOSED: [],
  };

  const allowedNextStatuses = allowedTransitions[outage.status];

  if (!allowedNextStatuses.includes(payload.status)) {
    throw new AppError(
      400,
      `Invalid outage status transition from ${outage.status} to ${payload.status}`,
    );
  }

  const updateData: {
    status: OutageStatus;
    restoredAt?: Date;
  } = {
    status: payload.status,
  };

  if (payload.status === OutageStatus.RESTORED) {
    updateData.restoredAt = new Date();
  }

  const updatedOutage = await prisma.outage.update({
    where: {
      id,
    },

    data: updateData,
  });

  return updatedOutage;
};

const deleteOutage = async (id: string) => {
  const outage = await prisma.outage.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!outage) {
    throw new AppError(404, "Outage not found");
  }

  const deletedOutage = await prisma.outage.update({
    where: {
      id,
    },

    data: {
      deletedAt: new Date(),
    },
  });

  return deletedOutage;
};

export const OutageService = {
  createOutage,
  getAllOutages,
  getSingleOutage,
  updateOutage,
  updateOutageStatus,
  deleteOutage,
};
