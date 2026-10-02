export interface ICreateNotificationPayload {
  title: string;
  message: string;
  type: "LOAD_SHEDDING" | "OUTAGE" | "SERVICE_REQUEST" | "PAYMENT" | "SYSTEM";
  userId: string;
}
