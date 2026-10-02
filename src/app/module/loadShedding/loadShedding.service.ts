import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateLoadSheddingPayload,
  IUpdateLoadSheddingPayload,
} from "./loadShedding.interface";

const createLoadShedding = async (payload: ICreateLoadSheddingPayload) => {
  const feeder = await prisma.feeder.findUnique({
    where: {
      id: payload.feederId,
    },
  });

  if (!feeder) {
    throw new AppError(404, "Feeder not found");
  }

  if (!feeder.isActive) {
    throw new AppError(400, "Cannot create schedule for an inactive feeder");
  }

  const creator = await prisma.user.findUnique({
    where: {
      id: payload.createdById,
    },
  });

  if (!creator) {
    throw new AppError(404, "Creator not found");
  }

  // Check whether another schedule overlaps
  // with the requested time on the same feeder.
  const conflictingSchedule = await prisma.loadSheddingSchedule.findFirst({
    where: {
      feederId: payload.feederId,
      status: {
        not: "CANCELLED",
      },
      startDateTime: {
        lt: payload.endDateTime,
      },
      endDateTime: {
        gt: payload.startDateTime,
      },
    },
  });

  if (conflictingSchedule) {
    throw new AppError(
      409,
      "Another load shedding schedule already exists during this time",
    );
  }

  const schedule = await prisma.loadSheddingSchedule.create({
    data: {
      title: payload.title,
      description: payload.description,
      startDateTime: payload.startDateTime,
      endDateTime: payload.endDateTime,
      reason: payload.reason,
      feederId: payload.feederId,
      createdById: payload.createdById,
    },
  });

  return schedule;
};

const getAllLoadShedding = async () => {
  const schedules = await prisma.loadSheddingSchedule.findMany({
    include: {
      feeder: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },

    orderBy: {
      startDateTime: "desc",
    },
  });

  return schedules;
};

const getSingleLoadShedding = async (id: string) => {
  const schedule = await prisma.loadSheddingSchedule.findUnique({
    where: {
      id,
    },

    include: {
      feeder: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!schedule) {
    throw new AppError(404, "Load shedding schedule not found");
  }

  return schedule;
};

const updateLoadShedding = async (
  id: string,
  payload: IUpdateLoadSheddingPayload,
) => {
  const existingSchedule = await prisma.loadSheddingSchedule.findUnique({
    where: {
      id,
    },
  });

  if (!existingSchedule) {
    throw new AppError(404, "Load shedding schedule not found");
  }

  const startDateTime = payload.startDateTime ?? existingSchedule.startDateTime;

  const endDateTime = payload.endDateTime ?? existingSchedule.endDateTime;

  if (endDateTime <= startDateTime) {
    throw new AppError(
      400,
      "End date and time must be after start date and time",
    );
  }

  if (payload.startDateTime || payload.endDateTime) {
    const conflictingSchedule = await prisma.loadSheddingSchedule.findFirst({
      where: {
        id: {
          not: id,
        },

        feederId: existingSchedule.feederId,

        status: {
          not: "CANCELLED",
        },

        startDateTime: {
          lt: endDateTime,
        },

        endDateTime: {
          gt: startDateTime,
        },
      },
    });

    if (conflictingSchedule) {
      throw new AppError(
        409,
        "Another load shedding schedule already exists during this time",
      );
    }
  }

  const updatedSchedule = await prisma.loadSheddingSchedule.update({
    where: {
      id,
    },

    data: payload,
  });

  return updatedSchedule;
};

const deleteLoadShedding = async (id: string) => {
  const existingSchedule = await prisma.loadSheddingSchedule.findUnique({
    where: {
      id,
    },
  });

  if (!existingSchedule) {
    throw new AppError(404, "Load shedding schedule not found");
  }

  const deletedSchedule = await prisma.loadSheddingSchedule.update({
    where: {
      id,
    },

    data: {
      status: "CANCELLED",
    },
  });

  return deletedSchedule;
};

export const LoadSheddingService = {
  createLoadShedding,
  getAllLoadShedding,
  getSingleLoadShedding,
  updateLoadShedding,
  deleteLoadShedding,
};
