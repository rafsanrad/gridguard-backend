export interface ICreateTechnicianPayload {
  employeeId: string;
  name: string;
  phone: string;
  specialization?: string;
}

export interface IUpdateTechnicianPayload {
  employeeId?: string;
  name?: string;
  phone?: string;
  specialization?: string;
}