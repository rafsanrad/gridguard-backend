export interface ICreateServiceRequestPayload {
  title: string;
  description?: string;
  amount: number;
}

export interface IUpdateServiceRequestPayload {
  title?: string;
  description?: string;
  status?:
    | "PENDING"
    | "APPROVED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "REJECTED";
}
