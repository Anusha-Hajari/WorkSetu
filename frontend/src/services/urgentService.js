const BASE = "http://localhost:8000/api/urgent";

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const urgentService = {
  create:     (data)              => fetch(`${BASE}/create`,              { method: "POST", headers: headers(), body: JSON.stringify(data) }).then(r => r.json()),
  getActive:  ()                  => fetch(`${BASE}/active`,              { headers: headers() }).then(r => r.json()),
  getById:    (id)                => fetch(`${BASE}/${id}`,               { headers: headers() }).then(r => r.json()),
  apply:      (id, lat, lon)      => fetch(`${BASE}/${id}/apply`,         { method: "POST", headers: headers(), body: JSON.stringify({ lat, lon }) }).then(r => r.json()),
  select:     (id, workerId)      => fetch(`${BASE}/${id}/select/${workerId}`, { method: "POST", headers: headers() }).then(r => r.json()),
  autoSelect: (id)                => fetch(`${BASE}/${id}/auto-select`,   { method: "POST", headers: headers() }).then(r => r.json()),
  updateStatus: (id, status)      => fetch(`${BASE}/${id}/status`,        { method: "POST", headers: headers(), body: JSON.stringify({ status }) }).then(r => r.json()),
  accept: (id) =>
    fetch(`${BASE}/${id}/accept`, {
      method: "POST",
      headers: headers()
    }).then(res => res.json()),
};