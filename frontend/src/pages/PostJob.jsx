import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Sparkles, Zap } from "lucide-react";

const SKILLS = ["Coding", "Plumbing", "Cleaning", "Design", "Editing", "Tutoring", "Cooking", "HR", "Teaching"];

function PostJob() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    requiredSkill: "",
    description: "",
    location: "Remote",
    type: "hourly",
    rate: "",
    isUrgent: false,
    interviewQuestions: [],
  });
  
  const [newQuestion, setNewQuestion] = useState("");

  const [loading, setLoading] = useState(false);
  const [topUsers, setTopUsers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        rate: form.rate ? Number(form.rate) : null,
        skills: [form.requiredSkill],
      };

      const res = await api.post("/api/add-job", payload);

      if (res.data.top_users) {
        setTopUsers(res.data.top_users);
      }

      setSuccess(true);
      setTimeout(() => navigate("/jobs"), 2500);
    } catch (err) {
      setError(err.response?.data?.detail || "Error creating job. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 px-4 max-w-2xl mx-auto pb-16">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
        Post a Job
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        Describe what you need — our AI will match the best candidates.
      </p>

      {success ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Job posted successfully!</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Redirecting to job listings…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="text-sm px-4 py-3 rounded-xl" style={{ color: "#ef4444", background: "#1c0000", border: "1px solid #ef4444" }}>
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs block mb-1.5" style={{ color: "var(--text-muted)" }}>Job Title *</label>
            <input
              type="text"
              placeholder="e.g. Need a plumber urgently"
              className="input-field"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          {/* Skill */}
          <div>
            <label className="text-xs block mb-1.5" style={{ color: "var(--text-muted)" }}>Required Skill *</label>
            <select
              className="input-field"
              value={form.requiredSkill}
              onChange={(e) => setForm({ ...form, requiredSkill: e.target.value })}
              required
            >
              <option value="">Select a skill…</option>
              {SKILLS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Type + Rate */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="text-xs block mb-1.5" style={{ color: "var(--text-muted)" }}>Job Type</label>
              <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="hourly">Hourly</option>
                <option value="longterm">Long-term</option>
              </select>
            </div>
            <div>
              <label className="text-xs block mb-1.5" style={{ color: "var(--text-muted)" }}>Rate (₹)</label>
              <input
                type="number"
                placeholder="e.g. 500"
                className="input-field"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
              />
            </div>
          </div>

          {/* Location */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "end" }}>
            <div>
              <label className="text-xs block mb-1.5" style={{ color: "var(--text-muted)" }}>Location</label>
              <input
                type="text"
                placeholder="Remote / City, State"
                className="input-field"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            
            <div 
              onClick={() => setForm({ ...form, isUrgent: !form.isUrgent })}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                form.isUrgent 
                ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]" 
                : "bg-slate-800/20 border-slate-700/50 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${form.isUrgent ? "bg-amber-500 text-black" : "bg-slate-700 text-slate-400"}`}>
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: form.isUrgent ? "#f59e0b" : "var(--text-muted)" }}>Urgent Mode</div>
                  <div className="text-[11px] font-medium leading-none mt-0.5" style={{ color: "var(--text-primary)" }}>Live Broadcast</div>
                </div>
              </div>
              <div className={`w-8 h-4 rounded-full relative transition-colors ${form.isUrgent ? "bg-amber-500" : "bg-slate-700"}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${form.isUrgent ? "left-[18px]" : "left-[2px]"}`} />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs block mb-1.5" style={{ color: "var(--text-muted)" }}>Description</label>
            <textarea
              rows={4}
              placeholder="Describe the work, requirements, and any special notes…"
              className="input-field resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* AI Interview Questions */}
          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-400 uppercase">AI Interview Questions</label>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="input-field text-sm" 
                placeholder="e.g. Do you have your own tools?" 
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => {
                  if (!newQuestion.trim()) return;
                  setForm({ ...form, interviewQuestions: [...form.interviewQuestions, newQuestion.trim()] });
                  setNewQuestion("");
                }}
                className="btn-primary py-2 px-4 text-xs bg-indigo-600 border-none"
              >
                Add
              </button>
            </div>
            {form.interviewQuestions.length > 0 && (
              <div className="space-y-2 pt-2">
                {form.interviewQuestions.map((q, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/50 rounded border border-slate-700/50">
                    <span className="text-xs text-slate-300 italic">"{q}"</span>
                    <button 
                      type="button" 
                      onClick={() => setForm({ ...form, interviewQuestions: form.interviewQuestions.filter((_, i) => i !== idx) })}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? (
              <>
                <Zap className="w-4 h-4 animate-pulse" />
                AI is matching candidates…
              </>
            ) : "Post Job"}
          </button>
        </form>
      )}

      {/* AI Match Results */}
      {topUsers.length > 0 && !loading && (
        <div className="mt-8 card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles style={{ color: "var(--accent-text)" }} />
            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              AI Matched Top Candidates
            </h3>
          </div>
          <div className="space-y-3">
            {topUsers.map((u, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--bg-card)" }}>
                <div>
                  <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>User #{i + 1}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Skills: {u.skills?.join(", ") || "—"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: "var(--accent-text)" }}>
                    {((u.score || u.matchScore || 0) * 100).toFixed(0)}% match
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>⭐ {u.rating?.toFixed(1) || "—"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PostJob;