export const getApiErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message ||
  error?.response?.data?.details ||
  error?.message ||
  fallbackMessage;
