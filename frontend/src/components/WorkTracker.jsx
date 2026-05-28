import React, { useEffect, useState, useRef } from "react";
import api from "../services/api";
import socket from "../services/socket";

import { API_BASE_URL as API_BASE } from "../services/api";

function VerdictBadge({ verdict }) {
  if (!verdict || verdict.verdict === "skipped") return null;
  const map = {
    authentic: { bg: "rgba(16,185,129,0.15)", color: "#10b981", icon: "🟢", label: "Authentic" },
    suspicious: { bg: "rgba(251,191,36,0.15)", color: "#fbbf24", icon: "🟡", label: "Suspicious" },
    flagged: { bg: "rgba(239,68,68,0.15)", color: "#ef4444", icon: "🔴", label: "Flagged" },
  };
  const s = map[verdict.verdict] || map.suspicious;
  return (
    <div style={{ marginTop: 6, padding: "6px 10px", background: s.bg, borderRadius: 6, fontSize: 11 }}>
      <span style={{ fontWeight: 700, color: s.color }}>{s.icon} AI Media Check: {s.label} ({verdict.confidence}%)</span>
      <p style={{ margin: "4px 0 0", fontSize: 10, color: "var(--text-muted)" }}>{verdict.reason}</p>
    </div>
  );
}

function StatsBar({ updates }) {
  if (!updates || updates.length === 0) return null;
  const total = updates.length;
  const aiApproved = updates.filter(u => u.status !== "rejected_by_ai").length;
  const posterApproved = updates.filter(u => u.status === "approved_by_poster").length;
  const avgScore = Math.round(updates.reduce((s, u) => s + (u.ai_score || 0), 0) / total);
  const mediaCount = updates.filter(u => u.mediaUrl).length;
  const items = [
    { label: "Updates", value: total, color: "#6366f1" },
    { label: "AI Pass", value: `${Math.round((aiApproved / total) * 100)}%`, color: "#4ade80" },
    { label: "Client OK", value: `${Math.round((posterApproved / total) * 100)}%`, color: "#10b981" },
    { label: "Avg Score", value: `${avgScore}/100`, color: "#fbbf24" },
    { label: "Media", value: mediaCount, color: "#818cf8" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 20 }}>
      {items.map(i => (
        <div key={i.label} style={{ background: "var(--bg-base)", borderRadius: 8, padding: "10px 8px", textAlign: "center", border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: i.color }}>{i.value}</div>
          <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.5px" }}>{i.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function WorkTracker({ bookingId, onActionProcessed }) {
  const [tracker, setTracker] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  const handleNegotiationAction = async (action) => {
    if (submittingAction) return;
    setSubmittingAction(true);
    try {
      const jobId = tracker?.job_id || bookingId;
      await api.post(`/api/chat/${jobId}/action`, { action });
      await fetchTracker();
      if (onActionProcessed) {
        onActionProcessed();
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to process negotiation action");
    } finally {
      setSubmittingAction(false);
    }
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updateText, setUpdateText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeData, setDisputeData] = useState({ reason: "", description: "" });
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showAiPrompt, setShowAiPrompt] = useState(false);

  useEffect(() => {
    let timer;
    if (tracker?.status === "in_progress" || tracker?.status === "In Progress" || tracker?.status === "work_undergoing" || tracker?.status === "Work Undergoing") {
      timer = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [tracker?.status]);

  useEffect(() => {
    // Show AI prompt every 45s if no update given (for demo)
    const promptTimer = setTimeout(() => {
      if (tracker?.role === "worker" && tracker?.status !== "Completed") {
        setShowAiPrompt(true);
      }
    }, 45000); 
    return () => clearTimeout(promptTimer);
  }, [tracker?.updates?.length, tracker?.role]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAiPromptAction = () => {
    setShowAiPrompt(false);
    // Smooth scroll to update area
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };
  const fileRef = useRef(null);

  const fetchTracker = async () => {
    try {
      const res = await api.get(`/api/tracking/${bookingId}`);
      setTracker(res.data);
      setError("");
      if (res.data.status === "Completed") checkReviewStatus(res.data.job_id);
    } catch (err) {
      console.error(err);
      setError("Failed to load tracking data. It may not be available yet.");
    } finally { setLoading(false); }
  };

  const checkReviewStatus = async (jobId) => {
    try { const res = await api.get(`/api/reviews/job/${jobId}/my-review`); setHasReviewed(res.data.has_reviewed); }
    catch (err) { console.error("Failed to check review status", err); }
  };

  const [workerLocation, setWorkerLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    fetchTracker();
    socket.emit("join_tracker", { booking_id: bookingId });
    
    const handler = () => fetchTracker();
    const locHandler = (loc) => {
        console.log("Worker location received:", loc);
        setWorkerLocation(loc);
    };

    socket.on("tracker_updated", handler);
    socket.on("worker_location", locHandler);

    // Location Reporting for Workers
    let locInterval;
    if (tracker?.role === "worker" && (tracker?.status === "in_progress" || tracker?.status === "In Progress" || tracker?.status === "work_undergoing" || tracker?.status === "Work Undergoing")) {
        locInterval = setInterval(() => {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    socket.emit("update_location", {
                        booking_id: bookingId,
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude
                    });
                });
            }
        }, 60000); // Every 60 seconds
    }

    return () => { 
        socket.off("tracker_updated", handler); 
        socket.off("worker_location", locHandler);
        socket.emit("leave_tracker", { booking_id: bookingId }); 
        if (locInterval) clearInterval(locInterval);
    };
  }, [bookingId, tracker?.role, tracker?.status]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
      setFilePreview("video");
    }
  };

  const handleRemoveFile = () => { setSelectedFile(null); setFilePreview(null); if (fileRef.current) fileRef.current.value = ""; };

  const handleRaiseDispute = async () => {
    if (!disputeData.reason || !disputeData.description) return alert("Please provide a reason and description");
    setSubmittingDispute(true);
    try {
      await api.post("/api/disputes/raise", { ...disputeData, booking_id: bookingId });
      alert("Dispute raised. An admin will contact you soon.");
      setShowDisputeModal(false);
      setDisputeData({ reason: "", description: "" });
      fetchTracker();
    } catch (err) { alert(err.response?.data?.detail || "Failed to raise dispute"); }
    finally { setSubmittingDispute(false); }
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    if ((!updateText.trim() && !selectedFile) || submitting) return;
    setSubmitting(true);
    try {
      let mediaUrl = null, media_verdict = null;
      if (selectedFile) {
        setUploading(true);
        const form = new FormData();
        form.append("file", selectedFile);
        const upRes = await api.post("/api/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
        mediaUrl = upRes.data.url;
        media_verdict = upRes.data.media_verdict;
        setUploading(false);
      }
      const finalText = updateText.trim() || (selectedFile ? `Progress photo/video uploaded: ${selectedFile.name}` : "");
      await api.post(`/api/tracking/${bookingId}/update`, { text: finalText, mediaUrl, media_verdict });
      setUpdateText(""); handleRemoveFile();
      await fetchTracker();
    } catch (err) { 
      const msg = err.response?.data?.detail || "Failed to submit update";
      alert(`Submission Rejected: ${msg}`); 
      setUploading(false); 
    }
    finally { setSubmitting(false); }
  };

  const handleAction = async (updateId, action) => {
    try { await api.post(`/api/tracking/${bookingId}/${action}/${updateId}`); await fetchTracker(); }
    catch (err) { alert(err.response?.data?.detail || "Failed to process action"); }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim() || submittingReview) return;
    setSubmittingReview(true);
    try {
      await api.post(`/api/reviews/${tracker.job_id}/review`, { rating: reviewRating, comment: reviewComment });
      alert("Review submitted successfully! Thank you.");
      setHasReviewed(true);
    } catch (err) { alert(err.response?.data?.detail || "Failed to submit review"); }
    finally { setSubmittingReview(false); }
  };

  if (loading) return <div className="card p-5 text-center text-slate-400">Loading tracker...</div>;
  if (error) return <div className="card p-5 text-center text-red-400">{error}</div>;
  if (!tracker) return null;

  const role = tracker.role;
  const isFinalized = tracker?.poster_agreed && tracker?.worker_agreed;

  return (
    <div className="card relative" style={{ padding: 20 }}>
      {/* AI Bot Overlay Prompt */}
      {showAiPrompt && isFinalized && (
        <div style={{ position: "fixed", bottom: 100, right: 30, zIndex: 100, maxWidth: 300, animation: "slideIn 0.5s ease-out" }}>
          <div className="card p-4 shadow-2xl border-indigo-500/50 bg-slate-900/90 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px]">🤖</div>
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">WorkSetu AI Assistant</span>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              "Hi! I've noticed you're working hard. Could you please submit a quick progress update (maybe a photo or a text note) to keep the client informed?"
            </p>
            <button onClick={handleAiPromptAction} className="btn-primary w-full py-1.5 text-[10px] uppercase font-bold">
              Submit Update Now
            </button>
          </div>
        </div>
      )}

      {!isFinalized ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fbbf24", animation: "pulse 1.5s infinite" }} />
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "var(--text-primary)", fontFamily: "'Inter', sans-serif" }}>
                  Agreement & Escrow Flow
                </span>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                  Status: <span style={{ color: "#fbbf24", fontWeight: "bold" }}>Negotiation Phase</span>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--bg-base)", padding: "4px 8px", borderRadius: 4 }}>
              Role: <span style={{ color: "var(--accent-text)", textTransform: "capitalize", fontWeight: "bold" }}>{role}</span>
            </div>
          </div>

          <div style={{ padding: 16, background: "rgba(99,102,241,0.03)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 12 }}>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.4 }}>
              Before work tracking starts, both parties must finalize the agreement terms and lock the funds in Escrow.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Step 1 */}
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "rgba(16,185,129,0.15)",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: "bold",
                  flexShrink: 0
                }}>
                  ✓
                </div>
                <div>
                  <h5 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Step 1: Discuss & Align</h5>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>
                    Discuss and align on details in the chat window.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: tracker?.poster_agreed ? "rgba(16,185,129,0.15)" : "rgba(251,191,36,0.15)",
                  color: tracker?.poster_agreed ? "#10b981" : "#fbbf24",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: "bold",
                  flexShrink: 0
                }}>
                  {tracker?.poster_agreed ? "✓" : "2"}
                </div>
                <div style={{ flex: 1 }}>
                  <h5 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Step 2: Lock Budget in Escrow</h5>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>
                    {tracker?.poster_agreed 
                      ? "✅ Funds locked securely in escrow." 
                      : "Recruiter deposits the budget into secure escrow mediation."}
                  </p>
                  {!tracker?.poster_agreed && (
                    <div style={{ marginTop: 10 }}>
                      {role === "poster" ? (
                        <button
                          onClick={() => handleNegotiationAction("poster_accept")}
                          disabled={submittingAction}
                          className="btn-primary text-xs px-4 py-2 bg-indigo-600 hover:bg-indigo-700 animate-pulse"
                          style={{ border: "none", fontWeight: "bold" }}
                        >
                          {submittingAction ? "Processing..." : "Finalize Offer & Lock Escrow 🔒"}
                        </button>
                      ) : (
                        <span style={{ fontSize: 10, padding: "4px 8px", background: "rgba(251,191,36,0.1)", color: "#fbbf24", borderRadius: 4, fontWeight: "bold" }}>
                          ⏳ Waiting for Recruiter to Deposit Escrow
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: tracker?.worker_agreed ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.15)",
                  color: tracker?.worker_agreed ? "#10b981" : "#9ca3af",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: "bold",
                  flexShrink: 0
                }}>
                  {tracker?.worker_agreed ? "✓" : "3"}
                </div>
                <div style={{ flex: 1 }}>
                  <h5 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Step 3: Accept Terms & Start</h5>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>
                    {tracker?.worker_agreed 
                      ? "✅ Worker accepted offer. Redirecting to tracking..."
                      : "Worker accepts terms to sign the contract and begin live work."}
                  </p>
                  {!tracker?.worker_agreed && (
                    <div style={{ marginTop: 10 }}>
                      {role === "worker" ? (
                        <button
                          onClick={() => handleNegotiationAction("worker_accept")}
                          disabled={submittingAction || !tracker?.poster_agreed}
                          className={`btn-primary text-xs px-4 py-2 font-bold ${!tracker?.poster_agreed ? "opacity-50 cursor-not-allowed bg-slate-700" : "bg-emerald-600 hover:bg-emerald-700 animate-pulse"}`}
                          style={{ border: "none" }}
                        >
                          {submittingAction ? "Processing..." : "Accept Terms & Start Working 🚀"}
                        </button>
                      ) : (
                        <span style={{ fontSize: 10, padding: "4px 8px", background: "rgba(107,114,128,0.1)", color: "#9ca3af", borderRadius: 4, fontWeight: "bold" }}>
                          {tracker?.poster_agreed ? "⏳ Waiting for Worker to Accept Offer" : "⏳ Awaiting Escrow Lock"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", animation: "pulse 1.5s infinite" }} />
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "var(--text-primary)", fontFamily: "'Inter', sans-serif" }}>
                  Live AI Work Tracker
                </span>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                  Session Duration: <span style={{ color: "var(--gold)", fontWeight: "bold" }}>{formatTime(elapsedTime)}</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
                {role === "poster" && workerLocation && (
                    <button 
                        onClick={() => setShowMap(!showMap)} 
                        style={{ fontSize: 10, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 6, padding: "4px 10px", color: "#10b981", cursor: "pointer", fontWeight: "bold" }}
                    >
                        {showMap ? "Hide Map" : "🛰️ View Live Location"}
                    </button>
                )}
                <div style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--bg-base)", padding: "4px 8px", borderRadius: 4 }}>
                    Role: <span style={{ color: "var(--accent-text)", textTransform: "capitalize", fontWeight: "bold" }}>{role}</span>
                </div>
            </div>
          </div>

          {showMap && workerLocation && (
              <div style={{ marginBottom: 20, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-color)", height: 200, background: "#000", position: "relative" }}>
                  <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${workerLocation.lon-0.01},${workerLocation.lat-0.01},${workerLocation.lon+0.01},${workerLocation.lat+0.01}&layer=mapnik&marker=${workerLocation.lat},${workerLocation.lon}`}
                  ></iframe>
                  <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.7)", padding: "2px 6px", borderRadius: 4, color: "#fff", fontSize: 9 }}>
                      {workerLocation.lat.toFixed(4)}, {workerLocation.lon.toFixed(4)}
                  </div>
              </div>
          )}

          {role === "worker" && (tracker.status === "in_progress" || tracker.status === "In Progress" || tracker.status === "work_undergoing" || tracker.status === "Work Undergoing") && (
              <div style={{ marginBottom: 16, padding: "6px 12px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, background: "#10b981", borderRadius: "50%", animation: "ping 1s infinite" }}></div>
                  <span style={{ fontSize: 10, color: "#10b981", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>Live Location Sharing Active</span>
              </div>
          )}

          {/* Stats Dashboard */}
          <StatsBar updates={tracker.updates} />

          {/* Worker Input Area */}
          {role === "worker" && (
            <div style={{ marginBottom: 24, padding: 12, background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8 }}>
              <h4 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Submit Progress Update</h4>
              <form onSubmit={handleSubmitUpdate} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <textarea className="input-field" rows="2"
                  placeholder="Describe what you have completed (e.g., 'Finished the first draft', 'Completed plumbing repair')"
                  value={updateText} onChange={(e) => setUpdateText(e.target.value)} style={{ fontSize: 13, resize: "none" }} />
                
                {/* Media Upload */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFileSelect}
                    style={{ display: "none" }} id="tracker-file-input" />
                  <button type="button" onClick={() => fileRef.current?.click()}
                    style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.3)", borderRadius: 6,
                      padding: "6px 12px", fontSize: 12, color: "#818cf8", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    📷 Attach Photo / Video
                  </button>
                  {selectedFile && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                      <button type="button" onClick={handleRemoveFile}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", marginLeft: 4, fontSize: 13 }}>✕</button>
                    </span>
                  )}
                </div>

                {/* Preview */}
                {filePreview && filePreview !== "video" && (
                  <div style={{ borderRadius: 6, overflow: "hidden", maxWidth: 200, border: "1px solid var(--border-color)" }}>
                    <img src={filePreview} alt="Preview" style={{ width: "100%", display: "block" }} />
                  </div>
                )}
                {filePreview === "video" && (
                  <div style={{ padding: 8, background: "rgba(99,102,241,0.05)", borderRadius: 6, fontSize: 11, color: "var(--text-muted)" }}>
                    🎥 Video selected: {selectedFile?.name}
                  </div>
                )}

                <button type="submit" disabled={submitting || (!updateText.trim() && !selectedFile)} className="btn-primary"
                  style={{ alignSelf: "flex-end", fontSize: 12, padding: "6px 12px" }}>
                  {uploading ? "Uploading media..." : submitting ? "Submitting..." : "Submit to AI"}
                </button>
              </form>
              <p style={{ fontSize: 10, color: "var(--text-hint)", marginTop: 6 }}>
                Updates are first evaluated by AI. Attached media is verified for authenticity (EXIF, timestamp, AI-generation detection).
              </p>
            </div>
          )}

          {/* Updates Timeline */}
          <h4 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 12, borderBottom: "1px solid var(--border-color)", paddingBottom: 6 }}>
            Tracking Timeline
          </h4>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 400, overflowY: "auto", paddingRight: 4 }}>
            {tracker.updates.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--text-hint)", textAlign: "center", padding: "20px 0" }}>No updates submitted yet.</p>
            ) : (
              [...tracker.updates].reverse().map((u) => {
                let statusColor = "var(--text-muted)", statusBg = "var(--bg-base)", statusBorder = "var(--border-color)", statusLabel = "Unknown";
                if (u.status === "rejected_by_ai") { statusColor = "#ef4444"; statusBg = "rgba(239,68,68,0.1)"; statusBorder = "rgba(239,68,68,0.3)"; statusLabel = "AI Rejected"; }
                else if (u.status === "pending_poster") { statusColor = "#fbbf24"; statusBg = "rgba(251,191,36,0.1)"; statusBorder = "rgba(251,191,36,0.3)"; statusLabel = "Pending Client Approval"; }
                else if (u.status === "approved_by_poster") { statusColor = "#10b981"; statusBg = "rgba(16,185,129,0.1)"; statusBorder = "rgba(16,185,129,0.3)"; statusLabel = "Approved - Work Continuing"; }
                else if (u.status === "rejected_by_poster") { statusColor = "#f97316"; statusBg = "rgba(249,115,22,0.1)"; statusBorder = "rgba(249,115,22,0.3)"; statusLabel = "Client Rejected"; }

                return (
                  <div key={u.id} style={{ padding: 12, background: "var(--bg-card)", border: `1px solid ${statusBorder}`, borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: "var(--text-hint)" }}>
                        {new Date(u.submitted_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: "bold", color: statusColor, background: statusBg, padding: "2px 6px", borderRadius: 4 }}>
                        {statusLabel}
                      </span>
                    </div>
                    
                    <p style={{ fontSize: 13, color: "var(--text-primary)", marginBottom: 8, lineHeight: 1.4 }}>"{u.text}"</p>
                    
                    {/* Media Attachment */}
                    {u.mediaUrl && (
                      <div style={{ marginBottom: 8 }}>
                        {u.mediaUrl.match(/\.(mp4|mov|avi|mkv)$/i) ? (
                          <video src={`${API_BASE}${u.mediaUrl}`} controls style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 6, border: "1px solid var(--border-color)" }} />
                        ) : (
                          <img src={`${API_BASE}${u.mediaUrl}`} alt="Progress proof"
                            onClick={() => setExpandedImage(`${API_BASE}${u.mediaUrl}`)}
                            style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 6, border: "1px solid var(--border-color)", cursor: "pointer", objectFit: "cover" }} />
                        )}
                        <VerdictBadge verdict={u.media_verdict} />
                      </div>
                    )}
                    
                    {/* AI Feedback */}
                    {u.ai_feedback && (
                      <div style={{ fontSize: 11, padding: 8, background: "rgba(255,255,255,0.03)", borderRadius: 4, color: "var(--text-muted)", borderLeft: `2px solid ${u.status === "rejected_by_ai" ? "#ef4444" : "#4ade80"}` }}>
                        <strong style={{ color: "var(--text-primary)" }}>AI Score: {Math.round(u.ai_score)}/100</strong><br/>
                        {u.ai_feedback}
                      </div>
                    )}
                    
                    {/* Poster Actions */}
                    {role === "poster" && u.status === "pending_poster" && tracker.status !== "Completed" && (
                      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                        <button onClick={() => handleAction(u.id, "approve")} className="btn-primary" style={{ flex: 1, fontSize: 11, padding: "6px 0", background: "#10b981", border: "none" }}>
                          Approve Update
                        </button>
                        <button onClick={() => handleAction(u.id, "reject")} className="btn-primary" style={{ flex: 1, fontSize: 11, padding: "6px 0", background: "transparent", border: "1px solid #ef4444", color: "#ef4444" }}>
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Complete Job & Release Escrow Banner */}
          {role === "poster" && tracker.status !== "Completed" && 
           tracker.poster_agreed && tracker.worker_agreed &&
           !tracker.updates.some(u => u.status === "pending_poster") && (
            <div style={{ marginTop: 24, padding: 16, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, textAlign: "center" }}>
              <h4 style={{ fontSize: 14, fontWeight: "bold", color: "#10b981", marginBottom: 8 }}>Ready to finish the job?</h4>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
                If you are satisfied with the work tracked above, you can officially complete the job and release the funds held in escrow to the worker.
              </p>
              <button onClick={async () => {
                  if (window.confirm("Are you sure you want to complete this job? The escrowed funds will be transferred to the worker immediately.")) {
                    try { await api.post(`/api/tracking/${bookingId}/complete_job`); await fetchTracker(); alert("Job completed successfully! Escrow released."); }
                    catch (err) { alert(err.response?.data?.detail || "Failed to complete job."); }
                  }
                }} className="btn-primary" style={{ padding: "8px 24px", background: "#10b981", border: "none", fontWeight: "bold" }}>
                Complete Job & Release Escrow
              </button>
            </div>
          )}

          {/* Dispute Button */}
          {tracker.status !== "Completed" && (
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <button onClick={() => setShowDisputeModal(true)} style={{ background: "transparent", border: "none", color: "var(--text-hint)", fontSize: 11, cursor: "pointer", textDecoration: "underline" }}>
                Need help? Raise a dispute with Admin mediation
              </button>
            </div>
          )}

          {/* Dispute Modal */}
          {showDisputeModal && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
              <div className="card" style={{ maxWidth: 400, width: "100%", padding: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>Raise a Dispute</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>An admin will review the tracker history and AI reports to resolve this issue.</p>
                
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>Reason</label>
                  <select className="input-field w-full" value={disputeData.reason} onChange={e => setDisputeData({...disputeData, reason: e.target.value})}>
                    <option value="">Select reason...</option>
                    <option value="unfair_rejection">Unfair Rejection of Work</option>
                    <option value="no_payment">Payment Issue / Refusal to Release</option>
                    <option value="fake_work">Inauthentic / Poor Quality Work</option>
                    <option value="other">Other Issue</option>
                  </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>Description</label>
                  <textarea className="input-field w-full" rows={4} value={disputeData.description} onChange={e => setDisputeData({...disputeData, description: e.target.value})} placeholder="Explain the situation in detail..." />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setShowDisputeModal(false)} className="btn-primary" style={{ flex: 1, background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>Cancel</button>
                  <button onClick={handleRaiseDispute} disabled={submittingDispute} className="btn-primary" style={{ flex: 1, background: "#6366f1", border: "none" }}>{submittingDispute ? "Submitting..." : "Raise Dispute"}</button>
                </div>
              </div>
            </div>
          )}
          
          {/* Job Completed State */}
          {tracker.status === "Completed" && (
            <div style={{ marginTop: 24, padding: 16, background: "rgba(16,185,129,0.05)", border: "1px dashed rgba(16,185,129,0.5)", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🎉</div>
              <h4 style={{ fontSize: 14, fontWeight: "bold", color: "#10b981", marginBottom: 4 }}>Job Completed</h4>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
                The work tracker has concluded and funds have been released to the worker's wallet.
              </p>
              {!hasReviewed ? (
                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 8, padding: 16, textAlign: "left" }}>
                  <h5 style={{ fontSize: 13, fontWeight: "bold", color: "var(--text-primary)", marginBottom: 8 }}>Leave a Review</h5>
                  <form onSubmit={handleSubmitReview} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Rating</label>
                      <div style={{ display: "flex", gap: 4 }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} type="button" onClick={() => setReviewRating(star)}
                            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: star <= reviewRating ? "#fbbf24" : "var(--border-color)" }}>★</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Comment</label>
                      <textarea className="input-field" rows="2"
                        placeholder={`How was your experience working with the ${role === "poster" ? "worker" : "client"}?`}
                        value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                        style={{ fontSize: 12, resize: "none", width: "100%" }} />
                    </div>
                    <button type="submit" disabled={submittingReview || !reviewComment.trim()} className="btn-primary"
                      style={{ alignSelf: "flex-end", fontSize: 12, padding: "6px 12px" }}>
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                  </form>
                </div>
              ) : (
                <div style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 8, padding: 12, color: "#fbbf24", fontSize: 12, fontWeight: "bold" }}>
                  ⭐ You have already submitted a review for this job.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div onClick={() => setExpandedImage(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <img src={expandedImage} alt="Full size" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }} />
        </div>
      )}
    </div>
  );
}