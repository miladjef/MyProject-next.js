const orderTransitions = {
  PENDING: new Set(["PENDING", "PROCESSING", "CANCELLED"]),
  PROCESSING: new Set(["PROCESSING", "SHIPPED", "CANCELLED"]),
  SHIPPED: new Set(["SHIPPED", "COMPLETED"]),
  COMPLETED: new Set(["COMPLETED"]),
  CANCELLED: new Set(["CANCELLED"]),
};

const paymentTransitions = {
  UNPAID: new Set(["UNPAID", "PENDING", "PAID", "FAILED"]),
  PENDING: new Set(["PENDING", "PAID", "FAILED"]),
  PAID: new Set(["PAID", "REFUNDED"]),
  FAILED: new Set(["FAILED", "PENDING", "PAID"]),
  REFUNDED: new Set(["REFUNDED"]),
};

const canTransitionOrder = (from, to) => Boolean(orderTransitions[from]?.has(to));
const canTransitionPayment = (from, to) => Boolean(paymentTransitions[from]?.has(to));

const validateOrderPaymentPair = (status, paymentStatus, method) => {
  if (status === "COMPLETED" && method !== "COD" && paymentStatus !== "PAID") return false;
  if (paymentStatus === "REFUNDED" && !["CANCELLED", "COMPLETED"].includes(status)) return false;
  return true;
};

export { canTransitionOrder, canTransitionPayment, validateOrderPaymentPair };
