import React, { useState, useEffect } from "react";
import { urgentService } from "../services/urgentService";
import { useAuth } from "../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";

// ⏳ Countdown
function Countdown({ expiresAt }) {
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    const calc = () => {
      setSecs(Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000)));
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;

  return (
    <div>
      {String(h).padStart(2,"0")}:
      {String(m).padStart(2,"0")}:
      {String(s).padStart(2,"0")}
    </div>
  );
}

export default function UrgentJobCard({ job, onUpdated }) {
  const { user } = useAuth();

  const [localJob, setLocalJob] = useState(job);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    setLocalJob(job);

    if (user && job?.applicants) {
      const already = job.applicants.some(
        (a) => a.user_id === user.id || a.worker_id === user.id
      );
      setApplied(already);
    }
  }, [job, user]);

  const isOwner = user && localJob?.posted_by === user?.id;
  const isExpired = new Date(localJob?.expires_at) < new Date();
  const isInProgress = localJob?.status === "in_progress" || localJob?.status === "work_undergoing" || localJob?.status === "filled";
  const isCompleted = localJob?.status === "completed";
  const isOpen = !isExpired && !isInProgress && !isCompleted;

  // Chat visibility: only poster + selected worker, only when in_progress/completed
  const isSelectedWorker = user && localJob?.selected_worker === user?.id;
  const showChat = (isInProgress || isCompleted) && (isOwner || isSelectedWorker);

  // 🔥 APPLY (normal flow)
  const handleApply = async () => {
    setApplying(true);
    try {
      const res = await urgentService.apply(localJob._id);

      if (res?.detail) throw new Error(res.detail);

      setApplied(true);
      alert("Applied successfully");

      onUpdated?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setApplying(false);
    }
  };

  const navigate = useNavigate();

  // 🔥 ACCEPT (instant booking — this triggers worker selection)
  const handleAccept = async () => {
    try {
      const res = await urgentService.accept(localJob._id);

      if (res?.detail) throw new Error(res.detail);

      alert("Job accepted 🚀 You can now chat with the poster.");

      // redirect to chat — this will work because the backend sets the worker as selected
      navigate(`/chat/${localJob._id}`);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{
      border: "1px solid #444",
      padding: 15,
      marginBottom: 10
    }}>

      <h3>{localJob.title}</h3>

      {isOpen && <Countdown expiresAt={localJob.expires_at} />}

      <p>{localJob.description}</p>

      <div>
        ₹{localJob.rate} | {localJob.duration_hours} hr | {localJob.work_mode}
      </div>

      {/* Status indicator */}
      {isInProgress && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#818cf8", fontWeight: "bold" }}>
          ⚡ Work Undergoing {localJob.selected_worker_name && `— Working with ${localJob.selected_worker_name}`}
        </div>
      )}
      {isCompleted && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#9ca3af", fontWeight: "bold" }}>
          ✓ Completed
        </div>
      )}

      <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>

        {/* APPLY */}
        {!isOwner && isOpen && !applied && (
          <button onClick={handleApply} disabled={applying}>
            {applying ? "Applying..." : "Apply"}
          </button>
        )}

        {/* ACCEPT BUTTON / STATUS */}
        {!isOwner && (
          isOpen ? (
            <button
              onClick={handleAccept}
              style={{ background: "green", color: "white", padding: "6px 16px", borderRadius: "6px", fontWeight: "bold" }}
            >
              Accept Now
            </button>
          ) : (
            <button
              disabled
              style={{ 
                background: "#333", 
                color: "#777", 
                padding: "6px 16px", 
                borderRadius: "6px", 
                cursor: "not-allowed",
                border: "1px solid #444"
              }}
            >
              {isInProgress ? "Work Undergoing" : isCompleted ? "Job Completed" : "Expired"}
            </button>
          )
        )}

        {applied && <span>✅ Applied</span>}

        {isOwner && <span>👑 Your Job</span>}

        {/* 💬 CHAT — only for poster + selected worker */}
        {showChat && (
          <Link
            to={`/chat/${localJob._id}`}
            style={{
              background: "#3b82f6",
              color: "white",
              padding: "4px 12px",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            💬 Chat
          </Link>
        )}

      </div>
    </div>
  );
}