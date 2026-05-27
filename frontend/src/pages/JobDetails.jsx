import React from "react";
import { useParams, Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import BookingSlot from "../components/BookingSlot";
import WorkTracker from "../components/WorkTracker";
import Loader from "../components/Loader";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import { useState, useEffect } from "react";

function JobDetails() {
  const { id } = useParams();
  const { data: job, loading } = useFetch(`/api/job/${id}`);  // ✅ Fixed: was /api/jobs/${id}
  const { user } = useAuth();
  const [bookingId, setBookingId] = useState(null);
  const [booked, setBooked] = useState(false);



  const handleBook = async (slot) => {
    try {
      const res = await api.post("/api/bookings", { jobId: id, ...slot });
      setBookingId(res.data._id);
      setBooked(true);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!id || !user) return;
    
    const fetchActiveBooking = async () => {
      try {
        const res = await api.get(`/api/tracking/job/${id}/active-booking`);
        if (res.data.booking_id) {
          setBookingId(res.data.booking_id);
        }
      } catch (err) {
        console.error("No active booking found yet.");
      }
    };

    fetchActiveBooking();
  }, [id, user]);


  if (loading) return <Loader fullPage />;
  if (!job) return <div className="pt-28 text-center text-slate-400">Job not found.</div>;

  return (
    <div className="pt-24 px-4 max-w-6xl mx-auto pb-16">
      <Link to="/jobs" className="text-sm text-slate-500 hover:text-slate-300 flex items-center gap-1 mb-6">
        ← Back to Jobs
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-6">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="badge bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{job.skill}</span>
              <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/20">{job.type}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{job.title}</h1>
            <p className="mt-3 text-slate-400 leading-relaxed">{job.description}</p>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                ["Rate", `₹${job.rate}/${job.type === "hourly" ? "hr" : "mo"}`],
                ["Duration", job.duration || "Flexible"],
                ["Team Size", `${job.hired_workers?.length || 0} / ${job.max_workers || 1} hired`],
              ].map(([label, val]) => (
                <div key={label} className="bg-slate-900/60 rounded-lg p-3">
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="text-sm font-medium text-white mt-0.5">{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Posted by */}
          <div className="card p-5">
            <div className="text-xs text-slate-500 mb-2">Posted by</div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm font-semibold text-indigo-300">
                {job.postedBy?.name?.[0]}
              </div>
              <div>
                <div className="text-sm font-medium text-white">{job.postedBy?.name || "Recruiter"}</div>
                <div className="text-xs text-slate-500">Member since {job.postedBy?.created_at ? new Date(job.postedBy.created_at).getFullYear() : "—"}</div>
              </div>
            </div>
          </div>

          {/* Real-time tracker if booked or if user is poster/worker with active tracking */}
          {bookingId && <WorkTracker jobId={id} bookingId={bookingId} />}

          {/* Recruiter Team View */}
          {user?.id === job.postedBy?.id && job.hired_workers?.length > 0 && (
              <div className="card p-5">
                  <h3 className="text-sm font-bold mb-4 text-white">Hired Team ({job.hired_workers?.length || 0})</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                      {job.hired_workers?.map(w => (
                          <div key={w.booking_id} className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                                      {w.name?.[0]}
                                  </div>
                                  <div className="text-xs font-medium text-white">{w.name}</div>
                              </div>
                              <button 
                                onClick={() => setBookingId(w.booking_id)}
                                className={`text-[10px] font-bold px-3 py-1 rounded transition-colors ${bookingId === w.booking_id ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
                              >
                                {bookingId === w.booking_id ? "Viewing" : "Track"}
                              </button>
                          </div>
                      ))}
                  </div>
              </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {user ? (
            booked ? (
              <div className="card p-5 text-center">
                <div className="text-green-400 text-2xl mb-2">✓</div>
                <div className="text-sm font-medium text-white">Booking Confirmed!</div>
                <p className="text-xs text-slate-500 mt-1">Tracking is now live above.</p>
                <Link to={`/payment/${bookingId}`} className="btn-primary w-full mt-4 block text-sm text-center">
                  Proceed to Payment
                </Link>
              </div>
            ) : (
              user?.id === job.postedBy?.id ? (
                <BookingSlot onSelect={handleBook} bookedSlots={job.bookedSlots || []} />
              ) : (
                <div className="card p-6 text-center border-dashed border-slate-700/50">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1 uppercase tracking-wider">
                    {bookingId ? "Work in Progress" : "Direct Negotiation"}
                  </h3>
                  <p className="text-[10px] text-slate-500 leading-relaxed mb-4">
                    {bookingId 
                      ? "You are currently working on this job. Track your progress or chat with the poster below." 
                      : "Message the recruiter directly to discuss rates and confirm your availability for this job."}
                  </p>
                  <Link 
                    to={bookingId ? `/tracking/${bookingId}` : `/chat/${id}`} 
                    className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    {bookingId ? "Go to Active Tracker 📍" : "Start Chatting"}
                  </Link>
                </div>
              )
            )
          ) : (
            <div className="card p-5 text-center">
              <p className="text-sm text-slate-400 mb-3">Sign in to book this service</p>
              <Link to="/login" className="btn-primary w-full block text-sm text-center">Login to Book</Link>
            </div>
          )}

          {/* AI recommendation box */}
          {job.aiScore && (
            <div className="card p-4 border-indigo-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-indigo-400 text-sm">⚡</span>
                <span className="text-xs font-medium text-indigo-300">AI Match Score</span>
              </div>
              <div className="text-2xl font-bold text-white">{job.aiScore}%</div>
              <p className="text-xs text-slate-500 mt-1">Based on your skills and history</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobDetails;