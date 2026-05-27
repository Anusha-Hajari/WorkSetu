import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api, { API_BASE_URL } from "../services/api";
import socket from "../services/socket";
import WorkTracker from "../components/WorkTracker";

function ChatPage() {
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [partnerOnline, setPartnerOnline] = useState(false);
  
  // Negotiation states
  const [jobStatus, setJobStatus] = useState("");
  const [role, setRole] = useState("");
  const [posterAgreed, setPosterAgreed] = useState(false);
  const [workerAgreed, setWorkerAgreed] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const bottomRef = useRef(null);

  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

  const userId = user?.id || user?.email || "anonymous";

  // 1️⃣ Check access first
  useEffect(() => {
    if (!user) {
      setAccessDenied(true);
      setAccessError("You must be logged in to access chat.");
      setLoading(false);
      return;
    }

    const checkAccess = async () => {
      try {
        const res = await api.get(`/api/chat-access/${jobId}`);
        if (res.data.allowed) {
          setPartnerName(res.data.partner_name || "");
          setPartnerId(res.data.partner_id || "");
          setPartnerOnline(res.data.partner_online || false);
          setRole(res.data.role);
          setJobStatus(res.data.status);
          setPosterAgreed(res.data.poster_agreed);
          setWorkerAgreed(res.data.worker_agreed);
          setBookingId(res.data.booking_id);
          // Access granted — fetch messages
          fetchMessages();
        }
      } catch (err) {
        setAccessDenied(true);
        setAccessError(
          err.response?.data?.detail ||
          "You don't have access to this chat."
        );
        setLoading(false);
      }
    };

    checkAccess();
  }, [jobId, user]);

  // 2️⃣ Fetch messages & Socket Listeners
  const fetchMessages = async () => {
    try {
      const res = await api.get(`/api/chat/${jobId}`);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!jobId || accessDenied) return;
    
    // Join socket room securely
    socket.emit("join_chat", { job_id: jobId, user_id: user?.id });
    
    // Listen for new messages
    const handleNewMessage = (msg) => {
      setMessages((prev) => {
        if (prev.some(m => m._id === msg._id)) return prev;
        // If it's from us, replace any temp message with the same text
        if (msg.sender_id === userId) {
          const hasTemp = prev.some(m => m._id?.startsWith("temp-") && m.message === msg.message);
          if (hasTemp) {
            return prev.map(m => (m._id?.startsWith("temp-") && m.message === msg.message) ? msg : m);
          }
        }
        return [...prev, msg];
      });
      
      // If it's a system message, we might need to refresh access state
      if (msg.sender_id === "system") {
        api.get(`/api/chat-access/${jobId}`).then(accessRes => {
          if (accessRes.data.allowed) {
            setJobStatus(accessRes.data.status);
            setPosterAgreed(accessRes.data.poster_agreed);
            setWorkerAgreed(accessRes.data.worker_agreed);
            setBookingId(accessRes.data.booking_id);
            setPartnerOnline(accessRes.data.partner_online || false);
          }
        }).catch(e => {
          if (e.response?.status === 403 || e.response?.status === 404) {
            setAccessDenied(true);
            setAccessError("The job status changed, and you no longer have access to this chat.");
          }
        });
      }
    };

    const handleUserStatusChange = (statusData) => {
      setPartnerId((pId) => {
        if (pId && statusData.user_id === pId) {
          setPartnerOnline(statusData.isOnline);
        }
        return pId;
      });
    };
    
    socket.on("receive_message", handleNewMessage);
    socket.on("user_status_change", handleUserStatusChange);
    
    return () => {
      socket.off("receive_message", handleNewMessage);
      socket.off("user_status_change", handleUserStatusChange);
    };
  }, [jobId, accessDenied, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── REDIRECT TO TRACKING ONCE CONFIRMED ───
  useEffect(() => {
    if (posterAgreed && workerAgreed && bookingId) {
      const timer = setTimeout(() => {
        navigate(`/tracking/${bookingId}`);
      }, 3000); // Give them 3 seconds to see the confirmation message
      return () => clearTimeout(timer);
    }
  }, [posterAgreed, workerAgreed, bookingId, navigate]);

  // 3️⃣ Send message through backend
  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || sending) return;

    const text = input.trim();
    const file = selectedFile;
    setSending(true);


    let imageUrl = null;
    let videoUrl = null;
    let documentUrl = null;
    let fileName = file?.name || null;

    try {
      // 1. Upload file if exists
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await api.post("/api/upload", formData);
        const url = uploadRes.data.url;
        const ext = file.name.split(".").pop().toLowerCase();

        if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
          imageUrl = url;
        } else if (["mp4", "mov", "avi", "mkv"].includes(ext)) {
          videoUrl = url;
        } else {
          documentUrl = url;
        }
      }

      const payload = { 
        message: text, 
        imageUrl, 
        videoUrl, 
        documentUrl, 
        fileName 
      };

      // Optimistically add text-only messages for immediate feedback
      if (!file) {
        const optimistic = { 
          sender_id: userId, 
          message: text, 
          job_id: jobId, 
          _id: "temp-" + Date.now(),
          sent_at: new Date().toISOString()
        };
        setMessages((prev) => [...prev, optimistic]);
      }

      const res = await api.post(`/api/chat/${jobId}`, payload);

      // Update state immediately with the real message from server
      setMessages((prev) => {
        if (prev.some(m => m._id === res.data._id)) return prev;
        // Replace temp message if it's a text-only match
        if (!file) {
          return prev.map(m => (m._id?.startsWith("temp-") && m.message === text) ? res.data : m);
        }
        return [...prev, res.data];
      });

      // Clear inputs
      setInput("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";


      
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to send message");
    } finally {
      setSending(false);
    }
  };


  // 4️⃣ Handle Negotiation Actions
  const handleAction = async (action) => {
    try {
      await api.post(`/api/chat/${jobId}/action`, { action });
      // Refresh state immediately
      const accessRes = await api.get(`/api/chat-access/${jobId}`);
      if (accessRes.data.allowed) {
        setJobStatus(accessRes.data.status);
        setPosterAgreed(accessRes.data.poster_agreed);
        setWorkerAgreed(accessRes.data.worker_agreed);
        setBookingId(accessRes.data.booking_id);
      }
      const msgRes = await api.get(`/api/chat/${jobId}`);
      setMessages(Array.isArray(msgRes.data) ? msgRes.data : []);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to process action");
      if (err.response?.status === 403) {
        setAccessDenied(true);
        setAccessError("You no longer have access to this chat.");
      }
    }
  };

  // ─── ACCESS DENIED VIEW ───────────────────────────────────────
  if (accessDenied) {
    return (
      <div className="pt-24 px-4 max-w-2xl mx-auto pb-16 text-center">
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          borderRadius: 12,
          padding: "48px 32px",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 className="text-xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
            Chat Access Restricted
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)", maxWidth: 400, margin: "0 auto" }}>
            {accessError}
          </p>
          <button
            onClick={() => navigate("/jobs")}
            className="btn-primary text-sm px-6 py-2"
          >
            ← Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const isConfirmed = posterAgreed && workerAgreed;

  return (
    <div className="pt-20 px-4 max-w-6xl mx-auto pb-16">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24, alignItems: "start" }}>
        
        {/* Left Column: Chat and Negotiation */}
        <div>
          <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Chat — Job #{jobId?.slice(-6)}
          </h2>
          {partnerName && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
              <p className="text-sm" style={{ color: "var(--text-muted)", margin: 0 }}>
                Chatting with <strong style={{ color: "var(--accent-text)" }}>{partnerName}</strong>
              </p>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                background: partnerOnline ? "rgba(16,185,129,0.1)" : "rgba(107,114,128,0.1)",
                border: partnerOnline ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(107,114,128,0.3)",
                borderRadius: 12,
                fontSize: 9,
                fontWeight: "bold",
                color: partnerOnline ? "#10b981" : "#9ca3af"
              }}>
                <span style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: partnerOnline ? "#10b981" : "#9ca3af",
                  display: "inline-block"
                }} />
                {partnerOnline ? "ONLINE" : "OFFLINE"}
              </div>
            </div>
          )}

          {/* ─── WORKER OFFLINE BANNER FOR POSTER ─── */}
          {role === "poster" && !partnerOnline && !isConfirmed && (
            <div className="mb-4 p-4 rounded-lg animate-pulse" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: "#ef4444" }}>Worker is Offline</h3>
                  <p className="text-xs text-slate-300">
                    {partnerName || "The worker"} has logged out or is currently offline. You can choose to finalize this worker now, or choose another candidate.
                  </p>
                </div>
                
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => handleAction("poster_accept")} className="btn-primary text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700">Finalize Worker</button>
                  <button onClick={() => handleAction("poster_reject")} className="text-xs px-3 py-1.5 rounded bg-slate-700 hover:bg-red-600 transition-colors">Choose Another</button>
                </div>
              </div>
            </div>
          )}

          {/* ─── NEGOTIATION BANNER ─── */}
          {!isConfirmed && (
            <div className="mb-4 p-4 rounded-lg" style={{ background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.3)" }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: "#fbbf24" }}>Negotiation Phase</h3>
                  <p className="text-xs text-slate-300">
                    {role === "poster" ? (
                      !posterAgreed ? "Discuss details with the worker. Once ready, you can finalize the terms or choose another worker." : "You have finalized the terms. Waiting for the worker to accept."
                    ) : (
                      !posterAgreed ? "Discuss details with the poster. Waiting for them to finalize the offer." : "The poster has finalized the offer. Do you accept the terms to begin work?"
                    )}
                  </p>
                </div>
                
                <div className="flex flex-col gap-2 shrink-0">
                  {role === "poster" && !posterAgreed && (
                    <>
                      <button onClick={() => handleAction("poster_accept")} className="btn-primary text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700">Finalize Worker</button>
                      <button onClick={() => handleAction("poster_reject")} className="text-xs px-3 py-1.5 rounded bg-slate-700 hover:bg-red-600 transition-colors">Choose Another</button>
                    </>
                  )}
                  {role === "worker" && posterAgreed && (
                    <>
                      <button onClick={() => handleAction("worker_accept")} className="btn-primary text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700">Accept Terms</button>
                      <button onClick={() => handleAction("worker_reject")} className="text-xs px-3 py-1.5 rounded bg-slate-700 hover:bg-red-600 transition-colors">Decline</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {isConfirmed && (
            <div className="mb-4 p-3 rounded-lg text-center" style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
              <span style={{ color: "#10b981", fontSize: 13, fontWeight: "bold" }}>✅ Job Confirmed. Tracking and work can now proceed!</span>
            </div>
          )}

          {/* Message list */}
          <div
            style={{
              height: 420, overflowY: "auto",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: 6, padding: 16,
              marginBottom: 12,
              display: "flex", flexDirection: "column", gap: 10,
            }}
          >
            {loading ? (
              <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: "auto" }}>Loading messages…</p>
            ) : messages.length === 0 ? (
              <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: "auto" }}>No messages yet. Say hello! 👋</p>
            ) : (
              messages.map((msg, i) => {
                if (msg.sender_id === "system") {
                   return (
                      <div key={msg._id || i} className="my-2 text-center">
                        <span className="text-xs px-3 py-1 rounded-full" style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-color)" }}>
                          {msg.message}
                        </span>
                      </div>
                   );
                }

                const isMe = msg.sender_id === userId;
                return (
                  <div key={msg._id || i} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "75%", padding: "8px 14px", borderRadius: 12,
                      background: isMe ? "var(--accent)" : "var(--bg-card)",
                      color: isMe ? "#fff" : "var(--text-primary)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}>
                      {!isMe && (
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>
                          {msg.sender_name || msg.sender_id}
                        </div>
                      )}

                      {/* Attachments */}
                      {msg.imageUrl && (
                        <img 
                          src={`${API_BASE_URL}${msg.imageUrl}`} 
                          alt="Uploaded" 
                          style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 8, display: "block", cursor: "pointer" }}
                          onClick={() => window.open(`${API_BASE_URL}${msg.imageUrl}`, "_blank")}
                        />
                      )}
                      {msg.videoUrl && (
                        <video 
                          src={`${API_BASE_URL}${msg.videoUrl}`} 
                          controls 
                          style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 8, display: "block" }} 
                        />
                      )}
                      {msg.documentUrl && (
                        <a 
                          href={`${API_BASE_URL}${msg.documentUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            display: "flex", alignItems: "center", gap: 8, 
                            background: "rgba(0,0,0,0.1)", padding: "8px 12px", 
                            borderRadius: 6, textDecoration: "none", color: "inherit",
                            marginBottom: 8, fontSize: 12
                          }}
                        >
                          <span>📄</span>
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {msg.fileName || "View Document"}
                          </span>
                        </a>
                      )}

                      {msg.message && <p style={{ fontSize: 13, margin: 0, whiteSpace: "pre-wrap" }}>{msg.message}</p>}
                      
                      {msg.sent_at && (
                        <div style={{ fontSize: 9, color: isMe ? "rgba(255,255,255,0.5)" : "var(--text-hint)", marginTop: 4, textAlign: "right" }}>
                          {new Date(msg.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: "none" }} 
              onChange={(e) => setSelectedFile(e.target.files[0] || null)}
            />
            
            <div style={{ display: "flex", flex: 1, flexDirection: "column" }}>
              {selectedFile && (
                <div style={{ 
                  fontSize: 10, padding: "2px 8px", background: "var(--accent-soft)", 
                  color: "var(--accent-text)", borderRadius: "4px 4px 0 0",
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                    📎 {selectedFile.name}
                  </span>
                  <button 
                    onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value=""; }}
                    style={{ marginLeft: 8, cursor: "pointer", color: "red" }}
                  >✕</button>
                </div>
              )}
              <textarea
                className="input-field"
                style={{ 
                  width: "100%", minHeight: 44, maxHeight: 120, resize: "none", 
                  paddingTop: 12, borderRadius: selectedFile ? "0 0 6px 6px" : 6 
                }}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                disabled={!isConfirmed && role === "worker" && posterAgreed}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 44, height: 44, borderRadius: 6,
                background: "var(--bg-card)", border: "1px solid var(--border-color)",
                color: "var(--text-primary)", fontSize: 20, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
              title="Attach file"
            >
              📎
            </button>

            <button
              className="btn-primary"
              style={{ height: 44, padding: "0 20px" }}
              onClick={handleSend}
              disabled={sending || (!input.trim() && !selectedFile) || (!isConfirmed && role === "worker" && posterAgreed)}
            >
              {sending ? "..." : "Send"}
            </button>

          </div>
        </div>

        {/* Right Column: Live Work Tracker */}
        <div style={{ position: "sticky", top: 88 }}>
          <WorkTracker bookingId={bookingId || jobId} />
        </div>

      </div>
    </div>
  );
}

export default ChatPage;