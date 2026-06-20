export const normalizePrice = (value) => {
  const numericValue =
    typeof value === "number"
      ? value
      : Number.parseFloat(String(value ?? "").replace(/[^0-9.]/g, ""));

  return Number.isFinite(numericValue) ? numericValue : 0;
};

export const getCommissionRate = (provider) => {
  const rate = Number(provider?.commissionRate);
  return Number.isFinite(rate) && rate > 0 ? rate : 0;
};

export const getCustomerServicePrice = (service, provider) => {
  const basePrice = normalizePrice(service?.price);
  const commissionRate = getCommissionRate(provider);
  const adjustedPrice = basePrice * (1 + commissionRate / 100);

  return Number(adjustedPrice.toFixed(2));
};

export const getDealerServicePrice = (service) =>
  normalizePrice(service?.dealerPrice ?? service?.basePrice ?? service?.price);

export const getOrderCustomerServicePrice = (service) =>
  normalizePrice(service?.customerPrice ?? service?.price);
