import { useParams, useNavigate } from "react-router-dom";
import WorkTracker from "../components/WorkTracker";

export default function Tracking() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="pt-24 px-4 max-w-4xl mx-auto pb-16">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Live Work Tracker
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Tracking progress and managing updates for Booking #{bookingId?.slice(-6)}
          </p>
        </div>
        <button 
          onClick={() => navigate(-1)} 
          className="text-xs px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 transition-colors"
        >
          ← Back
        </button>
      </div>

      <WorkTracker bookingId={bookingId} />
    </div>
  );
}
