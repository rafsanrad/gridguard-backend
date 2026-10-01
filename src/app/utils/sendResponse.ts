import { Response } from "express";

type TMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type TResponseData<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: TMeta;
};

export const sendResponse = <T>(
  res: Response,
  data: TResponseData<T>,
) => {
  const response: Record<string, unknown> = {
    success: data.success,
    statusCode: data.statusCode,
    message: data.message,
    data: data.data,
  };

  if (data.meta) {
    response.meta = data.meta;
  }

  res.status(data.statusCode).json(response);
};