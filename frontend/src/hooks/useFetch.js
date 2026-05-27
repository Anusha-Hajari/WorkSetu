import { useState, useEffect } from "react";
import api from "../services/api";

export function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    api.get(url)
      .then((res) => setData(res.data))
      .catch((err) => {
        // Don't crash on 401 — just set null
        if (err.response?.status !== 401) setError(err);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}