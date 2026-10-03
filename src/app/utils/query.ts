export const getSafeSortField = (
  sortBy: string | undefined,
  allowedFields: string[],
  defaultField: string,
) => {
  if (
    sortBy &&
    allowedFields.includes(sortBy)
  ) {
    return sortBy;
  }

  return defaultField;
};