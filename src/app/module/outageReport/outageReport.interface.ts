export interface ICreateOutageReportPayload {
  description?: string;
  location?: string;
  customerId: string;
  outageId?: string;
}