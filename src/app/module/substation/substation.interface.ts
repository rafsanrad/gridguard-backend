export interface ICreateSubstationPayload {
  name: string;
  code: string;
  address?: string;
  capacity?: number;
  zoneId: string;
}

export interface IUpdateSubstationPayload {
  name?: string;
  code?: string;
  address?: string;
  capacity?: number;
  zoneId?: string;
}