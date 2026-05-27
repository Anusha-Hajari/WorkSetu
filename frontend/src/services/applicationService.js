import api from "./api";

export const applicationService = {
  apply:    (data)  => api.post("/api/applications/apply", data),
  getByJob: (jobId) => api.get(`/api/applications?jobId=${jobId}`),
};

export const bookingService = {
  create:  (data) => api.post("/api/applications/bookings", data),
  getById: (id)   => api.get(`/api/applications/bookings/${id}`),
};