export interface ICreateFeederPayload {
  name: string;
  code: string;
  voltageLevel?: string;
  substationId: string;
}

export interface IUpdateFeederPayload {
  name?: string;
  code?: string;
  voltageLevel?: string;
  substationId?: string;
}