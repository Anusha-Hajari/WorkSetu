import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import ElitePassport from "../components/ElitePassport";
import SkillRadar from "../components/SkillRadar";
import EarningsPulse from "../components/EarningsPulse";

function Profile() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState("overview"); // overview, edit, documents
  
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    location: user?.location || "",
    skills: Array.isArray(user?.skills) ? user.skills.join(", ") : (user?.skills || ""),
    bio: user?.bio || "",
    linkedin: user?.linkedin || "",
    website: user?.website || "",
  });
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [kycStatus, setKycStatus] = useState("not_submitted"); 
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycForm, setKycForm] = useState({ id_type: "Aadhar", id_number: "" });
  const [kycFiles, setKycFiles] = useState({ id_image: null, selfie: null });
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [newPortItem, setNewPortItem] = useState({ title: "", description: "", imageUrl: "" });
  const [portFile, setPortFile] = useState(null);
  const [addingPort, setAddingPort] = useState(false);

  // Masking sensitive data
  const maskValue = (val, type = "id") => {
    if (!val) return "";
    if (type === "id") {
      return val.length > 4 ? `XXXX-XXXX-${val.slice(-4)}` : "XXXX-XXXX";
    }
    return val;
  };

  useEffect(() => {
    if (user?.id) {
      api.get(`/api/reviews/user/${user.id}`)
        .then(res => setReviews(res.data))
        .catch(err => console.error("Failed to load reviews", err));
      
      api.get("/api/kyc/status")
        .then(res => setKycStatus(res.data.status))
        .catch(err => console.error("Failed to load KYC status", err));
    }
  }, [user?.id]);

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!kycFiles.id_image || !kycFiles.selfie || !kycForm.id_number) return alert("Please fill all fields");
    
    setSubmittingKyc(true);
    const formData = new FormData();
    formData.append("id_type", kycForm.id_type);
    formData.append("id_number", kycForm.id_number);
    formData.append("id_image", kycFiles.id_image);
    formData.append("selfie_image", kycFiles.selfie);

    try {
      const res = await api.post("/api/kyc/submit", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setKycStatus(res.data.status);
      alert(res.data.msg);
      if (res.data.status === "verified") {
         setUser(prev => ({ ...prev, is_verified: true }));
      }
      setShowKycModal(false);
    } catch (err) { alert("KYC Submission failed"); }
    finally { setSubmittingKyc(false); }
  };

  const handleAddPortfolio = async (e) => {
    e.preventDefault();
    if (!portFile || !newPortItem.title) return alert("Please provide a title and image");
    
    setAddingPort(true);
    try {
      const formData = new FormData();
      formData.append("file", portFile);
      const uploadRes = await api.post("/api/uploads/media", formData);
      const imageUrl = uploadRes.data.url;

      await api.put("/api/users/portfolio/add", { ...newPortItem, imageUrl });
      
      setUser(prev => ({ 
        ...prev, 
        portfolio: [...(prev.portfolio || []), { ...newPortItem, imageUrl, id: Date.now().toString() }] 
      }));
      
      setShowPortfolioModal(false);
      setNewPortItem({ title: "", description: "", imageUrl: "" });
      setPortFile(null);
      alert("Portfolio item added!");
    } catch (err) { alert("Failed to add portfolio item"); }
    finally { setAddingPort(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const skillsArray = form.skills.split(",").map(s => s.trim()).filter(Boolean);
      await api.put("/api/users/profile", { ...form, skills: skillsArray });
      setUser(prev => ({ ...prev, ...form, skills: skillsArray }));
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError("Failed to save profile."); }
    finally { setSaving(false); }
  };

  return (
    <div className="pt-24 px-4 max-w-7xl mx-auto pb-32">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">
            Professional <span className="text-shine">Command Center</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm font-medium">Node ID: WS-{user?.id?.slice(-8).toUpperCase()}</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-white/5 p-1 rounded-full border border-white/10">
          {["overview", "edit", "documents"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? "bg-[var(--gold)] text-black shadow-lg" : "text-[var(--text-muted)] hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid lg:grid-cols-[1fr_400px] gap-8"
          >
            {/* Left Column: Visual Dashboard */}
            <div className="space-y-8">
               <div className="grid md:grid-cols-2 gap-8">
                  <ElitePassport user={user} />
                  <SkillRadar skills={user?.skills} />
               </div>

               <div className="grid md:grid-cols-2 gap-8">
                  <EarningsPulse />
                  {/* Reviews Summary */}
                  <div className="glass-card p-8 border-t-4 border-[var(--gold)]">
                     <h3 className="text-[10px] font-black tracking-[0.3em] text-[var(--gold)] mb-8 uppercase">Performance Metrics</h3>
                     <div className="grid grid-cols-2 gap-8">
                        <div>
                           <div className="text-[32px] font-black text-white">⭐ {user?.rating?.toFixed(1) || "5.0"}</div>
                           <div className="text-[8px] font-black text-[var(--text-hint)] uppercase tracking-widest mt-1">Average Reputation</div>
                        </div>
                        <div>
                           <div className="text-[32px] font-black text-white">{user?.completedJobs || 0}</div>
                           <div className="text-[8px] font-black text-[var(--text-hint)] uppercase tracking-widest mt-1">Protocols Completed</div>
                        </div>
                     </div>
                     <div className="mt-8 pt-8 border-t border-white/5">
                        <p className="text-[10px] text-[var(--text-muted)] italic leading-relaxed">
                           "Maintain a 4.8+ reputation to maintain Gold Tier status within the WorkSetu network."
                        </p>
                     </div>
                  </div>
               </div>

               {/* Portfolio Preview */}
               <div className="glass-card p-8">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-[10px] font-black tracking-[0.3em] text-white uppercase">Artisan Portfolio</h3>
                     <button onClick={() => setShowPortfolioModal(true)} className="text-[10px] font-black text-[var(--gold)] uppercase tracking-widest">Add Project +</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {user?.portfolio?.length > 0 ? (
                       user.portfolio.map(item => (
                         <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden border border-white/10">
                            <img src={item.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={item.title} />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 text-center">
                               <p className="text-[10px] font-black text-white uppercase">{item.title}</p>
                            </div>
                         </div>
                       ))
                     ) : (
                       <div className="col-span-4 py-20 text-center opacity-30">
                          <div className="text-4xl mb-4">🖼️</div>
                          <p className="text-[10px] font-black tracking-widest uppercase">No Projects Visualized</p>
                       </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Right Column: Trust & Badges */}
            <div className="space-y-6">
               {/* WorkSetu Trust Meter */}
               <div className="glass-card p-8 border-t-4 border-[var(--gold)] relative overflow-hidden">
                  <h3 className="text-[10px] font-black tracking-[0.2em] mb-8 text-[var(--gold)] uppercase">Network Trust Score</h3>
                  <div className="flex flex-col items-center">
                     <div className="relative w-40 h-40">
                        <svg className="w-full h-full transform -rotate-90">
                           <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/5" />
                           <motion.circle 
                             cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray="439.6"
                             initial={{ strokeDashoffset: 439.6 }}
                             animate={{ strokeDashoffset: 439.6 - (439.6 * (
                               (user?.is_verified ? 40 : 0) + 
                               (user?.bio?.length > 10 ? 10 : 0) + 
                               (user?.skills?.length > 5 ? 10 : 0) + 
                               ((user?.rating || 0) * 4) +
                               (Math.min((user?.completedJobs || 0) * 5, 20))
                             ) / 100) }}
                             className="text-[var(--gold)]"
                           />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <span className="text-4xl font-black text-white leading-none">
                              {Math.round(
                                 (user?.is_verified ? 40 : 0) + 
                                 (user?.bio?.length > 10 ? 10 : 0) + 
                                 (user?.skills?.length > 5 ? 10 : 0) + 
                                 ((user?.rating || 0) * 4) +
                                 (Math.min((user?.completedJobs || 0) * 5, 20))
                              )}
                           </span>
                           <span className="text-[8px] font-black tracking-[0.3em] text-[var(--gold)] uppercase mt-2">Reputation Index</span>
                        </div>
                     </div>
                     <div className="mt-8 w-full">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[var(--text-hint)] mb-2">
                           <span>Tier Status</span>
                           <span className="text-[var(--gold)]">{user?.is_verified ? "GOLD TIER" : "RISING TALENT"}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${Math.min(100, (user?.completedJobs || 0) * 10)}%` }}
                             className="h-full bg-[var(--gold)]" 
                           />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Badge Shelf */}
               <div className="glass-card p-8">
                  <h3 className="text-[10px] font-black tracking-[0.2em] mb-6 text-white uppercase">Artisan Badges</h3>
                  <div className="grid grid-cols-3 gap-4">
                     {user?.badges?.map(badge => (
                        <div key={badge.id} className="aspect-square rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center p-2">
                           <div className="text-2xl mb-1">{badge.icon}</div>
                           <div className="text-[7px] font-black text-center text-white uppercase tracking-tighter">{badge.name}</div>
                        </div>
                     ))}
                     <div className="aspect-square rounded-xl bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center p-2 opacity-30 grayscale">
                        <div className="text-2xl mb-1 filter blur-[1px]">🔒</div>
                        <div className="text-[7px] font-black text-center text-white uppercase">Legendary</div>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === "edit" && (
          <motion.div 
            key="edit"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl mx-auto"
          >
             <form onSubmit={handleSave} className="glass-card p-10 space-y-8">
                <div className="flex items-center gap-6 mb-4">
                   <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-black shadow-xl"
                      style={{ background: "var(--accent)" }}>
                      {user?.name?.[0]?.toUpperCase()}
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter">Identity Editor</h3>
                      <p className="text-[var(--text-muted)] text-xs">Update your professional node parameters.</p>
                   </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-hint)]">Protocol Name</label>
                      <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field w-full text-sm py-4" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-hint)]">Contact Node</label>
                      <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-field w-full text-sm py-4" />
                   </div>
                   <div className="sm:col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-hint)]">Geographic Sector</label>
                      <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="input-field w-full text-sm py-4" />
                   </div>
                   <div className="sm:col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-hint)]">Capability Matrix (Skills)</label>
                      <input value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} className="input-field w-full text-sm py-4" />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-hint)]">Professional Manifest (Bio)</label>
                   <textarea value={form.bio} rows={4} onChange={e => setForm({...form, bio: e.target.value})} className="input-field w-full text-sm py-4 resize-none" />
                </div>

                <button type="submit" disabled={saving} className="btn-primary w-full py-5 text-sm font-black tracking-[0.2em]">
                   {saving ? "ENCRYPTING DATA..." : "SYNC TO NETWORK"}
                </button>
             </form>
          </motion.div>
        )}

        {activeTab === "documents" && (
          <motion.div 
            key="documents"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="max-w-2xl mx-auto space-y-8"
          >
             <div className="glass-card p-10 border-t-4 border-blue-500/30">
                <h3 className="text-[10px] font-black tracking-[0.3em] text-blue-400 mb-8 uppercase">Identity Vault Status</h3>
                {kycStatus === "verified" ? (
                  <div className="space-y-6">
                     <div className="flex items-center gap-4 text-green-400">
                        <span className="text-3xl">🛡️</span>
                        <div>
                           <div className="text-xl font-black uppercase tracking-tighter">Verification Active</div>
                           <div className="text-[10px] font-bold text-white/50 tracking-widest">LEVEL 2 CRYPTO-SIGNED</div>
                        </div>
                     </div>
                     <div className="p-6 bg-black/40 border border-white/5 rounded-2xl">
                        <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Masked Identity Node</div>
                        <div className="text-lg font-mono text-white/80">{maskValue("VERIFIED_ID_NODE_12345")}</div>
                     </div>
                  </div>
                ) : (
                  <div className="space-y-6 text-center py-8">
                     <div className="text-4xl opacity-40 mb-4">🔐</div>
                     <p className="text-[var(--text-muted)] text-sm font-medium leading-relaxed max-w-sm mx-auto">
                        Your identity has not been verified on the neural network. Verify now to unlock Gold Tier jobs and instant payments.
                     </p>
                     <button onClick={() => setShowKycModal(true)} className="btn-secondary border-blue-500/30 text-blue-400 px-12 py-4 text-[10px] font-black tracking-widest">INITIATE VERIFICATION</button>
                  </div>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KYC Modal */}
      {showKycModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold">Verify Your Identity</h2>
            <p className="text-xs text-slate-400">Upload your ID and a selfie to get the Verified Badge.</p>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">ID Type</label>
                <select 
                  className="input-field w-full text-sm" 
                  value={kycForm.id_type} 
                  onChange={e => setKycForm({...kycForm, id_type: e.target.value})}
                >
                  <option value="Aadhar">Aadhar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="Driving_License">Driving License</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">ID Number</label>
                <input 
                  type="text" 
                  className="input-field w-full text-sm" 
                  placeholder="Enter ID Number" 
                  value={kycForm.id_number} 
                  onChange={e => setKycForm({...kycForm, id_number: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">ID Image</label>
                  <input type="file" className="hidden" id="id_img" onChange={e => setKycFiles({...kycFiles, id_image: e.target.files[0]})} />
                  <label htmlFor="id_img" className="w-full h-24 border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors overflow-hidden">
                    {kycFiles.id_image ? <img src={URL.createObjectURL(kycFiles.id_image)} className="w-full h-full object-cover" alt="ID" /> : <span className="text-[10px]">Upload ID</span>}
                  </label>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Selfie</label>
                  <input type="file" className="hidden" id="selfie_img" onChange={e => setKycFiles({...kycFiles, selfie: e.target.files[0]})} />
                  <label htmlFor="selfie_img" className="w-full h-24 border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors overflow-hidden">
                    {kycFiles.selfie ? <img src={URL.createObjectURL(kycFiles.selfie)} className="w-full h-full object-cover" alt="Selfie" /> : <span className="text-[10px]">Upload Selfie</span>}
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowKycModal(false)} className="btn-primary flex-1 bg-slate-800 border-none">Cancel</button>
              <button 
                onClick={handleKycSubmit} 
                disabled={submittingKyc}
                className="btn-primary flex-1 bg-indigo-600 border-none"
              >
                {submittingKyc ? "Verifying..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Modal */}
      {showPortfolioModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold">Add Work Sample</h2>
            <p className="text-xs text-slate-400">Showcase your skills with a title, description, and proof of work.</p>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Project Title</label>
                <input 
                  type="text" 
                  className="input-field w-full text-sm" 
                  placeholder="e.g. Living Room Redesign" 
                  value={newPortItem.title} 
                  onChange={e => setNewPortItem({...newPortItem, title: e.target.value})} 
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Description</label>
                <textarea 
                  className="input-field w-full text-sm" 
                  rows={3} 
                  placeholder="Briefly explain what you did..." 
                  value={newPortItem.description} 
                  onChange={e => setNewPortItem({...newPortItem, description: e.target.value})} 
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Work Image</label>
                <input type="file" className="hidden" id="port_img" onChange={e => setPortFile(e.target.files[0])} />
                <label htmlFor="port_img" className="w-full h-40 border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors overflow-hidden">
                  {portFile ? <img src={URL.createObjectURL(portFile)} className="w-full h-full object-cover" alt="Preview" /> : <span className="text-[10px]">Click to upload project photo</span>}
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowPortfolioModal(false)} className="btn-primary flex-1 bg-slate-800 border-none">Cancel</button>
              <button 
                onClick={handleAddPortfolio} 
                disabled={addingPort}
                className="btn-primary flex-1 bg-indigo-600 border-none"
              >
                {addingPort ? "Uploading..." : "Add to Portfolio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;