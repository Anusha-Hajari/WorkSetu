import { useState, useEffect } from "react";
import { useFetch } from "../hooks/useFetch";
import Loader from "../components/Loader";
import api from "../services/api";
import { Link } from "react-router-dom";

function Payments() {
  const [wallet, setWallet] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);

  // Fetch completed jobs that the user was assigned to
  const { data: apps, loading: loadingApps, error } = useFetch("/api/applications/my-applications");

  const fetchWallet = async () => {
    try {
      const res = await api.get("/api/wallet");
      setWallet(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWallet(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleDeposit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setDepositing(true);
    try {
      const res = await api.post("/api/wallet/deposit", { amount });
      alert(res.data.msg);
      setDepositAmount("");
      fetchWallet();
    } catch (err) {
      alert(err.response?.data?.detail || "Deposit failed");
    } finally {
      setDepositing(false);
    }
  };

  const handleTestCredit = async () => {
    try {
      const res = await api.post("/api/wallet/test-credit");
      alert(res.data.msg);
      fetchWallet();
    } catch (err) {
      alert("Failed to add test credit");
    }
  };


  return (
    <div className="pt-24 px-4 max-w-4xl mx-auto pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Wallet & Payments
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Manage your virtual wallet balance and view transaction history.
        </p>
      </div>

      {loadingWallet ? <Loader /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Wallet Balance Card */}
          <div className="card p-6" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))", borderColor: "rgba(16,185,129,0.3)" }}>
            <h3 className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Available Balance</h3>
            <div className="text-4xl font-black mb-4" style={{ color: "#10b981" }}>
              ₹{wallet?.balance?.toFixed(2) || "0.00"}
            </div>
            
            <form onSubmit={handleDeposit} className="flex gap-2">
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="Amount (₹)"
                className="input-field py-2"
                style={{ flex: 1, minWidth: 0 }}
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
              <button type="submit" disabled={depositing || !depositAmount} className="btn-primary py-2 px-4 whitespace-nowrap">
                {depositing ? "Adding..." : "Add Funds"}
              </button>
            </form>

            <button 
              onClick={handleTestCredit}
              className="w-full mt-3 text-xs font-bold py-2 rounded border border-dashed border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
            >
              🎁 Get Free Test Credit (₹5000)
            </button>
          </div>


          {/* Escrow Balance Card */}
          <div className="card p-6" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))", borderColor: "rgba(245,158,11,0.3)" }}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Funds in Escrow</h3>
                <div className="text-4xl font-black mb-4" style={{ color: "#f59e0b" }}>
                  ₹{wallet?.escrow_balance?.toFixed(2) || "0.00"}
                </div>
              </div>
              <div className="text-3xl">🔒</div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              These funds are currently locked in active jobs. They will be transferred to the worker's wallet once you approve the final work tracker.
            </p>
          </div>
        </div>
      )}

      {/* Payment History */}
      <h2 className="text-xl font-bold mb-4 mt-10" style={{ color: "var(--text-primary)" }}>Recent Applications & Earnings</h2>
      
      {loadingApps && <Loader />}
      {error && (
        <div className="card p-4 text-sm" style={{ color: "#ef4444" }}>
          Could not load application data.
        </div>
      )}

      {!loadingApps && !error && (
        <>
          {apps?.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="text-3xl mb-3">💸</div>
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>No payment records yet</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Complete a job to see your earnings here.
              </p>
              <Link to="/jobs" className="btn-primary inline-block mt-4 text-sm">
                Browse Jobs
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {apps?.map((app) => (
                <div key={app._id} className="card p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                      {app.job_title || "Untitled Job"}
                    </div>
                    <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      Applied {new Date(app.applied_at).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                  <div className="text-right">
                    {app.rate ? (
                      <div className="font-bold text-sm" style={{ color: "var(--accent-text)" }}>
                        ₹{app.rate}
                      </div>
                    ) : (
                      <div className="text-xs" style={{ color: "var(--text-hint)" }}>—</div>
                    )}
                    <div
                      className="text-xs mt-1 font-medium"
                      style={{ color: app.status === "completed" ? "#10b981" : "var(--text-hint)" }}
                    >
                      {app.status === "completed" ? "✅ Paid out to wallet" : app.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Payments;