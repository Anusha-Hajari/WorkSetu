import { useState, useEffect } from "react";
import { urgentService } from "../services/urgentService";
export default function PostUrgentJob({ onClose, onPosted }) {
  const [form, setForm] = useState({
    title: "",
    skill: "",
    description: "",
    duration_hours: 2,
    work_mode: "remote",
    rate: "",
    location_name: "",
  });

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ FETCH SKILLS FROM BACKEND (PERMANENT FIX)
  useEffect(() => {
    fetch("http://localhost:8000/api/urgent/skills")
      .then((res) => res.json())
      .then((data) => setSkills(data))
      .catch(() => setSkills([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let lat = null;
      let lon = null;

      // 📍 get location if onsite
      if (form.work_mode === "onsite" && navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              lat = pos.coords.latitude;
              lon = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { timeout: 5000 }
          );
        });
      }

      // ✅ FINAL CLEAN PAYLOAD
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        skill: form.skill, // 👈 comes directly from backend list
        duration_hours: Number(form.duration_hours),
        work_mode: form.work_mode,
        rate: Number(form.rate),
        location_name: form.location_name || "N/A",
        lat: lat || null,
        lon: lon || null,
      };

      console.log("FINAL PAYLOAD:", JSON.stringify(payload, null, 2));

      const job = await urgentService.create(payload);

      if (job && job._id) {
        onPosted?.(job);
        onClose?.();
      } else {
        setError(job?.msg || "Failed to post urgent job");
      }

    } catch (err) {
      console.error("ERROR:", err);
      setError(err.message || "Failed to post. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid rgba(201,168,92,0.3)",
          borderRadius: 4,
          padding: 28,
          maxWidth: 480,
          width: "100%",
        }}
        onClick={(e) => e.stopPropagation()}
      >

        <h2 style={{ fontSize: 18, marginBottom: 10 }}>
          Post Urgent Request
        </h2>

        {/* ❌ ERROR DISPLAY */}
        {error && (
          <div
            style={{
              fontSize: 12,
              color: "#f87171",
              background: "#1c0000",
              border: "1px solid #f87171",
              padding: 8,
              marginBottom: 10,
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          {/* TITLE */}
          <input
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
            placeholder="Title"
            required
            className="input-field"
          />

          {/* SKILL (DYNAMIC FROM BACKEND) */}
          <select
            value={form.skill}
            onChange={(e) =>
              setForm({ ...form, skill: e.target.value })
            }
            required
            className="input-field"
          >
            <option value="">Select skill</option>
            {skills.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          {/* DURATION */}
          <input
            type="number"
            value={form.duration_hours}
            onChange={(e) =>
              setForm({ ...form, duration_hours: e.target.value })
            }
            className="input-field"
          />

          {/* MODE */}
          <select
            value={form.work_mode}
            onChange={(e) =>
              setForm({ ...form, work_mode: e.target.value })
            }
            className="input-field"
          >
            <option value="remote">Remote</option>
            <option value="onsite">On-site</option>
          </select>

          {/* RATE */}
          <input
            type="number"
            value={form.rate}
            onChange={(e) =>
              setForm({ ...form, rate: e.target.value })
            }
            placeholder="Rate"
            required
            className="input-field"
          />

          {/* LOCATION (ONLY IF ONSITE) */}
          {form.work_mode === "onsite" && (
            <input
              value={form.location_name}
              onChange={(e) =>
                setForm({ ...form, location_name: e.target.value })
              }
              placeholder="Location"
              className="input-field"
            />
          )}

          {/* DESCRIPTION */}
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="Description"
            required
            className="input-field"
          />

          {/* BUTTONS */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Posting..." : "⚡ Post Urgent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}