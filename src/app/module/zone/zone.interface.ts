export interface ICreateZonePayload {
  name: string;
  code: string;
  description?: string;
}

export interface IUpdateZonePayload {
  name?: string;
  code?: string;
  description?: string;
}