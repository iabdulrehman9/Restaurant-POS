export const ALLOWED_ORDER_STATUSES = [
  "pending",
  "preparing",
  "ready",
  "completed",
  "cancelled",
  "waste",
];

export const isAllowedOrderStatus = (status) =>
  ALLOWED_ORDER_STATUSES.includes(String(status || "").toLowerCase());
