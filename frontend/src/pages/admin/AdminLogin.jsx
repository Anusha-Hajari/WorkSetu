import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Invalid email or password");
        return;
      }

      if (!data.user?.is_admin) {
        setError("This account does not have admin access.");
        return;
      }

      localStorage.setItem("token", data.token);
      setUser(data.user);
      navigate("/admin");

    } catch (err) {
      setError("Cannot connect to server. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-4"
            style={{ background: "var(--accent)" }}
          >
            A
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Admin Login
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            WorkSetu Admin Panel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div
              className="text-sm rounded-xl px-4 py-3"
              style={{
                color: "#ef4444",
                background: "#fef2f2",
                border: "1px solid #fecaca",
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              className="text-xs block mb-1.5 font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="admin@worksetu.com"
              className="input-field"
            />
          </div>

          <div>
            <label
              className="text-xs block mb-1.5 font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              placeholder="••••••••"
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Signing in..." : "Login as Admin"}
          </button>

          <p className="text-center text-xs" style={{ color: "var(--text-hint)" }}>
            <Link to="/" style={{ color: "var(--accent-text)" }}>
              ← Back to WorkSetu
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}