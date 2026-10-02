import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICreateTechnicianAssignmentPayload } from "./technicianAssignment.interface";

const createTechnicianAssignment = async (
  payload: ICreateTechnicianAssignmentPayload,
) => {
  const outage = await prisma.outage.findFirst({
    where: {
      id: payload.outageId,
      deletedAt: null,
    },
  });

  if (!outage) {
    throw new AppError(404, "Outage not found");
  }

  if (outage.status === "RESTORED" || outage.status === "CLOSED") {
    throw new AppError(
      400,
      "Cannot assign technician to a restored or closed outage",
    );
  }

  const technician = await prisma.technician.findFirst({
    where: {
      id: payload.technicianId,
      isActive: true,
    },
  });

  if (!technician) {
    throw new AppError(404, "Technician not found");
  }

  if (technician.status !== "AVAILABLE") {
    throw new AppError(400, "Technician is not available");
  }

  const assignedBy = await prisma.user.findFirst({
    where: {
      id: payload.assignedById,
      deletedAt: null,
    },
  });

  if (!assignedBy) {
    throw new AppError(404, "Assigning user not found");
  }

  const assignment = await prisma.$transaction(async (tx) => {
    const newAssignment = await tx.technicianAssignment.create({
      data: {
        outageId: payload.outageId,
        technicianId: payload.technicianId,
        assignedById: payload.assignedById,
        notes: payload.notes,
      },
      include: {
        outage: true,
        technician: true,
        assignedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await tx.technician.update({
      where: {
        id: payload.technicianId,
      },
      data: {
        status: "ASSIGNED",
      },
    });

    await tx.outage.update({
      where: {
        id: payload.outageId,
      },
      data: {
        status: "ASSIGNED",
      },
    });

    return newAssignment;
  });

  return assignment;
};

const getAllTechnicianAssignments = async () => {
  const assignments = await prisma.technicianAssignment.findMany({
    include: {
      outage: true,
      technician: true,
      assignedBy: {
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

  return assignments;
};

const getSingleTechnicianAssignment = async (id: string) => {
  const assignment = await prisma.technicianAssignment.findUnique({
    where: {
      id,
    },
    include: {
      outage: true,
      technician: true,
      assignedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new AppError(404, "Technician assignment not found");
  }

  return assignment;
};

export const TechnicianAssignmentService = {
  createTechnicianAssignment,
  getAllTechnicianAssignments,
  getSingleTechnicianAssignment,
};
