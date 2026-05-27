import { useEffect, useState } from "react";
import api from "../services/api";
import Loader from "../components/Loader";

export default function WalletPage() {
  const [balance, setBalance] = useState({ balance: 0, escrow_balance: 0 });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchWallet = async () => {
    try {
      const [balRes, histRes] = await Promise.all([
        api.get("/api/wallet/"),
        api.get("/api/wallet/history")
      ]);
      setBalance(balRes.data);
      setHistory(histRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWallet(); }, []);

  const handleAction = async (type) => {
    if (!amount || parseFloat(amount) <= 0) return alert("Enter valid amount");
    setProcessing(true);
    try {
      const endpoint = type === "deposit" ? "/api/wallet/deposit" : "/api/wallet/withdraw";
      await api.post(endpoint, { amount: parseFloat(amount) });
      alert(`${type === "deposit" ? "Deposit" : "Withdrawal"} successful!`);
      setAmount("");
      fetchWallet();
    } catch (err) { alert(err.response?.data?.detail || "Action failed"); }
    finally { setProcessing(false); }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div className="pt-24 px-4 max-w-4xl mx-auto pb-16">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>My Wallet</h1>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="card p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none">
          <div className="text-xs uppercase font-bold opacity-80 mb-1">Available Balance</div>
          <div className="text-3xl font-black">₹{balance.balance.toLocaleString()}</div>
        </div>
        <div className="card p-6 border-amber-500/30" style={{ background: "rgba(245, 158, 11, 0.05)" }}>
          <div className="text-xs uppercase font-bold text-amber-500 mb-1">Held in Escrow</div>
          <div className="text-3xl font-black text-amber-400">₹{balance.escrow_balance.toLocaleString()}</div>
        </div>
        <div className="card p-6 flex flex-col justify-center gap-3">
          <input 
            type="number" 
            className="input-field text-sm" 
            placeholder="Amount" 
            value={amount} 
            onChange={e => setAmount(e.target.value)} 
          />
          <div className="flex gap-2">
            <button onClick={() => handleAction("deposit")} disabled={processing} className="btn-primary flex-1 py-2 text-xs bg-indigo-600 border-none">Add Funds</button>
            <button onClick={() => handleAction("withdraw")} disabled={processing} className="btn-primary flex-1 py-2 text-xs bg-slate-800 border-none">Withdraw</button>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>Transaction History</h2>
        {history.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <div className="text-3xl mb-2">📜</div>
            <p className="text-sm">No transactions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map(t => (
              <div key={t._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/30 transition-colors border-b border-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    t.amount > 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                  }`}>
                    {t.type === 'deposit' ? '💰' : t.type === 'withdrawal' ? '🏧' : t.type.includes('escrow') ? '🔒' : '💸'}
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{t.description}</div>
                    <div className="text-[10px] text-slate-500">{new Date(t.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                <div className={`text-sm font-black ${t.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                  {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
