import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import AdminLayout from "../../components/admin/AdminLayout";
import Loader from "../../components/Loader";

function AdminDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  const loadDisputes = () => {
    setLoading(true);
    adminService.getDisputes()
      .then((res) => setDisputes(res.data))
      .finally(() => setLoading(false));
  };

  const handleSelect = async (id) => {
    try {
      const res = await adminService.getDispute(id);
      setSelectedDispute(res.data);
      setAdminNote("");
    } catch (err) { alert("Failed to fetch dispute details"); }
  };

  const handleResolve = async (resolution) => {
    if (!adminNote.trim()) return alert("Please provide an admin note for the resolution.");
    setResolving(true);
    try {
      await adminService.resolveDispute(selectedDispute._id, { resolution, admin_note: adminNote });
      alert("Dispute resolved!");
      setSelectedDispute(null);
      loadDisputes();
    } catch (err) { alert(err.response?.data?.detail || "Failed to resolve"); }
    finally { setResolving(false); }
  };

  useEffect(() => { loadDisputes(); }, []);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Mediation Center</h1>
        <button onClick={loadDisputes} className="text-xs text-indigo-400 hover:underline">Refresh</button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* List */}
        <div className="space-y-3">
          {loading ? <Loader /> : (
            disputes.length === 0 ? (
              <div className="card p-10 text-center text-slate-500 text-sm">No active disputes</div>
            ) : (
              disputes.map((d) => (
                <div 
                  key={d._id} 
                  onClick={() => handleSelect(d._id)}
                  className={`card p-4 cursor-pointer transition-all ${selectedDispute?._id === d._id ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'hover:border-slate-700'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${d.status === 'resolved' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {d.status}
                    </span>
                    <span className="text-[10px] text-slate-500">{new Date(d.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm font-semibold text-white">{d.reason.replace('_', ' ').toUpperCase()}</div>
                  <div className="text-xs text-slate-400 mt-1 line-clamp-1">{d.description}</div>
                  <div className="text-[10px] mt-3 text-slate-500">Raised by: {d.raised_by_name}</div>
                </div>
              ))
            )
          )}
        </div>

        {/* Details / Mediation Workspace */}
        <div className="sticky top-6">
          {selectedDispute ? (
            <div className="card p-6 space-y-5 border-indigo-500/30">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Dispute Details</h2>
                <p className="text-xs text-slate-500">Review the evidence below to make a fair decision.</p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Reason</div>
                  <div className="text-sm text-amber-400 font-medium">{selectedDispute.reason.replace('_', ' ')}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Description</div>
                  <div className="text-sm text-slate-300 leading-relaxed">{selectedDispute.description}</div>
                </div>
              </div>

              {/* Work Evidence (Tracker History) */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Work Evidence History</h3>
                {selectedDispute.tracker?.updates?.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedDispute.tracker.updates.map((u, i) => (
                      <div key={i} className="bg-slate-800/40 border border-slate-700/50 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-[10px] font-bold text-indigo-400">Update #{i+1}</span>
                           <span className={`text-[10px] px-1.5 py-0.5 rounded ${u.status === 'approved_by_poster' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                             {u.status.replace('_', ' ')}
                           </span>
                        </div>
                        <p className="text-xs text-white mb-2">"{u.text}"</p>
                        {u.mediaUrl && (
                          <div className="space-y-2">
                            <img src={`http://localhost:8000${u.mediaUrl}`} className="rounded w-full h-24 object-cover border border-slate-700" alt="Proof" />
                            <div className="text-[9px] p-2 bg-slate-900/80 rounded border border-slate-700/50">
                              <span className="font-bold text-indigo-300">AI VERDICT:</span> {u.media_verdict?.verdict} ({u.media_verdict?.confidence}%)
                              <div className="text-slate-500 mt-1">{u.media_verdict?.reason}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic">No work updates submitted yet.</div>
                )}
              </div>

              {/* Mediation Actions */}
              {selectedDispute.status !== 'resolved' ? (
                <div className="pt-4 border-t border-slate-700 space-y-4">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-2 block">Admin Resolution Note</label>
                    <textarea 
                      className="input-field w-full text-sm" 
                      rows={3} 
                      placeholder="Explain your decision to both parties..."
                      value={adminNote}
                      onChange={e => setAdminNote(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleResolve('pay_worker')}
                      disabled={resolving}
                      className="btn-primary bg-green-600 hover:bg-green-700 border-none text-xs py-3"
                    >
                      Release to Worker
                    </button>
                    <button 
                      onClick={() => handleResolve('refund_poster')}
                      disabled={resolving}
                      className="btn-primary bg-red-600 hover:bg-red-700 border-none text-xs py-3"
                    >
                      Refund Poster
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-slate-700">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="text-xs font-bold text-green-400 mb-1 uppercase">Resolved: {selectedDispute.resolution.replace('_', ' ')}</div>
                    <div className="text-xs text-slate-400 italic">"{selectedDispute.admin_note}"</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card h-64 flex flex-col items-center justify-center text-slate-500 space-y-2 opacity-50">
              <div className="text-3xl">⚖️</div>
              <p className="text-sm">Select a dispute to start mediation</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDisputes;