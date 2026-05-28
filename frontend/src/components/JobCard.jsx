import { Link } from "react-router-dom";
import { formatDate } from "../utils/formatDate";
import { acceptJob } from "../services/jobService";
import { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../hooks/useAuth";

export default function JobCard({ job }) {
  const [localStatus, setLocalStatus] = useState(job.status || "open");
  const [isClosed, setIsClosed] = useState(false);
  const socket = useSocket();
  const { user } = useAuth();

  const handleAccept = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await acceptJob(job._id, token);
      alert(res.msg || "Job accepted");
      setLocalStatus("assigned");
    } catch (err) {
      console.error(err);
      alert("Error accepting job");
    }
  };

  useEffect(() => {
    if (!socket) return;
    const handleStatusUpdate = (data) => {
      if (data.job_id === job._id) {
        setLocalStatus(data.status);
        if (data.status === "completed") setIsClosed(true);
      }
    };
    socket.on("job_status_change", handleStatusUpdate);
    socket.on("job_closed", (data) => {
      if (data.job_id === job._id) setIsClosed(true);
    });
    return () => {
      socket.off("job_status_change", handleStatusUpdate);
      socket.off("job_closed");
    };
  }, [socket, job._id]);

  const isPoster = user && job.postedBy?.id === user.id;
  const isAssigned = user && job.assignedTo === user.id;
  const jobHasWorker = !!job.assignedTo;
  const showChat = jobHasWorker && (isPoster || isAssigned);

  return (
    <div className="card p-6 flex flex-col justify-between group h-full">
      <div className="relative">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border border-[var(--gold)] text-[var(--gold)] bg-[var(--accent-soft)]">
            {job.type === "hourly" ? "Hourly" : "Project"}
          </span>
          
          {job.aiScore >= 80 && (
            <span className="text-[10px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
              ⟡ AI Verified {job.aiScore}%
            </span>
          )}

          {localStatus && localStatus !== "open" && (
            <span className={`text-[10px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border ${
              localStatus === "completed" 
                ? "border-zinc-500/30 text-zinc-500 bg-zinc-500/5" 
                : "border-indigo-500/30 text-indigo-500 bg-indigo-500/5 animate-pulse"
            }`}>
              {localStatus === "assigned" || localStatus === "in_progress" || localStatus === "work_undergoing" || localStatus === "filled" ? "Work Undergoing" : "Completed"}
            </span>
          )}
        </div>

        <h3 className="text-base font-black leading-tight tracking-wide text-[var(--text-primary)] group-hover:text-[var(--gold)] transition-colors duration-300 mb-2 font-['Cinzel']">
          {job.title}
        </h3>

        <p className="text-[11px] text-[var(--text-muted)] line-clamp-3 leading-relaxed mb-6 font-medium">
          {job.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {job.skills?.slice(0, 3).map((s) => (
            <span key={s} className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded border border-[var(--border-color)] text-[var(--text-hint)] bg-[var(--bg-base)]">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t border-[var(--border-color)] flex items-center justify-between mt-auto">
        <div>
          <div className="text-xl font-black text-[var(--gold)] font-['Inter']">
            ₹{job.rate}
            <span className="text-[10px] font-medium text-[var(--text-hint)] ml-1">
              {job.type === "hourly" ? "/hr" : "/fixed"}
            </span>
          </div>
          <div className="text-[9px] font-bold text-[var(--text-hint)] uppercase tracking-tighter mt-0.5">
            Posted {formatDate(job.createdAt)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showChat ? (
            <Link to={`/chat/${job._id}`} className="px-4 py-2 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20">
              💬 Chat
            </Link>
          ) : !isPoster && !isClosed && localStatus === "open" ? (
            <button onClick={handleAccept} className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
              Accept
            </button>
          ) : null}

          {isClosed ? (
            <span className="px-4 py-2 bg-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-zinc-700">
              Closed
            </span>
          ) : (
            <Link to={`/jobs/${job._id}`} className="px-4 py-2 bg-[var(--bg-card)] text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-[var(--border-color)] transition-all border border-[var(--border-color)]">
              Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}