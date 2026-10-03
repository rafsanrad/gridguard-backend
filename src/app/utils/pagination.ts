export const getPagination = (
  page: number = 1,
  limit: number = 10,
) => {
  const currentPage = Math.max(1, page);
  const currentLimit = Math.max(1, Math.min(limit, 100));

  const skip = (currentPage - 1) * currentLimit;

  return {
    page: currentPage,
    limit: currentLimit,
    skip,
  };
};

export const getPaginationMeta = (
  page: number,
  limit: number,
  total: number,
) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};