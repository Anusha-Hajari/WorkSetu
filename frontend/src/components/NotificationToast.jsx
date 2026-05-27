import { useEffect, useState } from "react";
import socket from "../services/socket";
import { Link } from "react-router-dom";

export default function NotificationToast() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleNotification = (data) => {
      const id = Date.now();
      setNotifications((prev) => [...prev, { id, ...data }]);
      
      // Auto-remove after 6 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 6000);
    };

    socket.on("new_notification", handleNotification);
    
    return () => {
      socket.off("new_notification", handleNotification);
    };
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-3">
      {notifications.map((n) => (
        <div 
          key={n.id} 
          className="glass-card p-4 min-w-[300px] border border-[var(--gold)]/30 shadow-[0_10px_30px_-10px_rgba(197,160,89,0.3)] animate-fade-up relative overflow-hidden group"
        >
          {/* Animated Gold Edge */}
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--gold)]" />
          
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
              <span className="text-base">✨</span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-[var(--gold)]">
                  {n.title || "System Update"}
                </span>
                <span className="text-[9px] font-bold text-[var(--text-hint)]">Just now</span>
              </div>
              <p className="text-[12px] font-medium leading-relaxed text-[var(--text-primary)] opacity-90">
                {n.message}
              </p>
              
              {n.link && (
                <div className="mt-2.5 flex justify-end">
                  <Link 
                    to={n.link} 
                    onClick={() => {
                      // Optionally clear notification when clicked
                      setNotifications((prev) => prev.filter((item) => item.id !== n.id));
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-[var(--gold)] hover:bg-[#d4af37] text-black hover:text-black rounded transition-all cursor-pointer font-['Inter'] shadow-[0_4px_12px_rgba(197,160,89,0.2)]"
                    style={{ textDecoration: "none" }}
                  >
                    💬 Go to Chat
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar Background */}
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--border-color)]">
            <div className="h-full bg-[var(--gold)] animate-[progress_6s_linear_forwards]" />
          </div>
        </div>
      ))}
    </div>
  );
}
