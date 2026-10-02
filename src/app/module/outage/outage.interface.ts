import { OutageStatus, OutageType } from "../../../generated/prisma/enums";

export interface ICreateOutagePayload {
  title: string;
  description?: string;
  type: OutageType;
  startedAt: Date;
  estimatedRestoredAt?: Date;
  cause?: string;
  affectedCustomers?: number;
  feederId: string;
}

export interface IUpdateOutagePayload {
  title?: string;
  description?: string;
  estimatedRestoredAt?: Date;
  cause?: string;
  affectedCustomers?: number;
}

export interface IUpdateOutageStatusPayload {
  status: OutageStatus;
  notes?: string;
}