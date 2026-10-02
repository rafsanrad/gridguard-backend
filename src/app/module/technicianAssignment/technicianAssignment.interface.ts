export interface ICreateTechnicianAssignmentPayload {
  outageId: string;
  technicianId: string;
  assignedById: string;
  notes?: string;
}