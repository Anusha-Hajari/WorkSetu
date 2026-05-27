import api from "./api";

export const paymentService = {
  createOrder: (data)     => api.post("/api/payment/create-order", data),
  verify:      (data)     => api.post("/api/payment/verify", data),
};