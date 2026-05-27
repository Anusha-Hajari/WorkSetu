import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import api from "../services/api";

function Apply() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: job } = useFetch(`/api/job/${id}`);
  const [form, setForm] = useState({ coverLetter: "", experience: "", rate: "" });
  const [answers, setAnswers] = useState({}); // {question_text: answer_text}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Format answers for backend: [{question: str, answer: str}]
      const formattedAnswers = Object.entries(answers).map(([q, a]) => ({ question: q, answer: a }));

      await api.post("/api/applications/apply-job", {
        job_id: id,
        cover_letter: form.coverLetter,
        experience: form.experience,
        rate: Number(form.rate),
        interview_answers: formattedAnswers.length > 0 ? formattedAnswers : null
      });

      setSuccess(true);
      setTimeout(() => navigate("/my-applications"), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 px-4 max-w-xl mx-auto pb-16">
      <Link to={`/jobs/${id}`} className="text-sm mb-6 block" style={{ color: "var(--text-muted)" }}>
        ← Back to Job
      </Link>

      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
        Apply for Job
      </h1>
      {job && (
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          {job.title}
        </p>
      )}

      {success ? (
        <div className="card p-6 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Application submitted!</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Redirecting to your applications…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          {error && (
            <div className="text-sm rounded-xl px-4 py-3" style={{ color: "#ef4444", background: "#1c0000", border: "1px solid #ef4444" }}>
              {error}
            </div>
          )}

          {/* AI Interview Questions UI */}
          {job?.interviewQuestions?.length > 0 && (
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-indigo-400 uppercase flex items-center gap-2">
                🤖 AI Screening Interview
              </h3>
              {job.interviewQuestions.map((q, idx) => (
                <div key={idx}>
                  <label className="text-xs block mb-1.5 text-slate-300 italic">Question: {q}</label>
                  <textarea
                    className="input-field text-sm"
                    rows={2}
                    placeholder="Your answer..."
                    required
                    value={answers[q] || ""}
                    onChange={e => setAnswers({...answers, [q]: e.target.value})}
                  />
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="text-xs block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Your Expected Rate (₹)
            </label>
            <input
              type="number"
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })}
              placeholder="Enter your rate"
              className="input-field text-sm"
              required
            />
          </div>

          <div>
            <label className="text-xs block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Relevant Experience
            </label>
            <input
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: e.target.value })}
              placeholder="e.g. 3 years as professional cook"
              className="input-field text-sm"
              required
            />
          </div>

          <div>
            <label className="text-xs block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Cover Message
            </label>
            <textarea
              value={form.coverLetter}
              onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
              rows={4}
              placeholder="Why are you the best fit for this job?"
              className="input-field text-sm resize-none"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? "Submitting…" : "Submit Application"}
          </button>
        </form>
      )}
    </div>
  );
}

export default Apply;