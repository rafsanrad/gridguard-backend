export interface ICreateAreaPayload {
  name: string;
  code: string;
  address?: string;
  description?: string;
  feederId: string;
}

export interface IUpdateAreaPayload {
  name?: string;
  code?: string;
  address?: string;
  description?: string;
  feederId?: string;
}