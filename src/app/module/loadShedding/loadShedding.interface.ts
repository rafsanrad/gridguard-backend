export interface ICreateLoadSheddingPayload {
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  reason?: string;
  feederId: string;
}

export interface IUpdateLoadSheddingPayload {
  title?: string;
  description?: string;
  startDateTime?: Date;
  endDateTime?: Date;
  reason?: string;
}