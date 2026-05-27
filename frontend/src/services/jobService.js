import api from "./api";

export const jobService = {
  getAll:  (query = "") => api.get(`/api/jobs${query}`),
  getById: (id)         => api.get(`/api/job/${id}`),
  create:  (data)       => api.post("/api/add-job", data),
  update:  (id, data)   => api.put(`/api/update-job/${id}`, data),
  delete:  (id)         => api.delete(`/api/delete-job/${id}`),
};

export const createJobWithAI = async (data, token) => {
  const res = await fetch("http://127.0.0.1:8000/api/add-job", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  return res.json();
};
export const acceptJob = async (jobId, token) => {
  const res = await fetch(`http://127.0.0.1:8000/api/accept-job/${jobId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return res.json();
};