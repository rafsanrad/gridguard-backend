export interface ICreatePaymentPayload {
  serviceRequestId: string;
  customerId: string;
}

export interface IExecutePaymentPayload {
  paymentID: string;
}