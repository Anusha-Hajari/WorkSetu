import api from "./api";

export const adminService = {
  getStats:       ()         => api.get("/api/admin/stats"),
  getUsers:       ()         => api.get("/api/admin/users"),
  banUser:        (id)       => api.put(`/api/admin/users/${id}/ban`),
  unbanUser:      (id)       => api.put(`/api/admin/users/${id}/unban`),
  verifyUser:     (id)       => api.put(`/api/admin/users/${id}/verify`),
  deleteUser:     (id)       => api.delete(`/api/admin/users/${id}`),
  getJobs:        ()         => api.get("/api/admin/jobs"),
  approveJob:     (id)       => api.put(`/api/admin/jobs/${id}/approve`),
  rejectJob:      (id)       => api.put(`/api/admin/jobs/${id}/reject`),
  deleteJob:      (id)       => api.delete(`/api/admin/jobs/${id}`),
  getBookings:    ()         => api.get("/api/admin/bookings"),
  getDisputes:    ()         => api.get("/api/disputes/admin/all"),
  getDispute:     (id)       => api.get(`/api/disputes/admin/${id}`),
  resolveDispute: (id, data) => api.post(`/api/disputes/admin/${id}/resolve`, data),
};