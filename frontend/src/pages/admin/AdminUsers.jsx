import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import AdminLayout from "../../components/admin/AdminLayout";
import Loader from "../../components/Loader";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = () => {
    adminService.getUsers()
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const action = async (fn, id) => {
    await fn(id);
    load();
  };

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Users</h1>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..." className="input-field text-sm"
          style={{ maxWidth: 260 }} />
      </div>

      {loading ? <Loader /> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-card)" }}>
                {["Name", "Email", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold"
                    style={{ color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: "var(--accent)" }}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ color: "var(--text-primary)" }}>{u.name}</span>
                      {u.is_admin && (
                        <span className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}>Admin</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: u.is_banned ? "#fef2f2" : u.is_verified ? "#f0fdf4" : "var(--bg-card)",
                        color: u.is_banned ? "#ef4444" : u.is_verified ? "#22c55e" : "var(--text-muted)",
                      }}>
                      {u.is_banned ? "Banned" : u.is_verified ? "Verified" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!u.is_verified && !u.is_banned && (
                        <button onClick={() => action(adminService.verifyUser, u._id)}
                          className="text-xs px-2 py-1 rounded transition-colors"
                          style={{ color: "#22c55e", border: "1px solid #22c55e" }}>
                          Verify
                        </button>
                      )}
                      {u.is_banned ? (
                        <button onClick={() => action(adminService.unbanUser, u._id)}
                          className="text-xs px-2 py-1 rounded transition-colors"
                          style={{ color: "var(--accent-text)", border: "1px solid var(--accent)" }}>
                          Unban
                        </button>
                      ) : (
                        !u.is_admin && (
                          <button onClick={() => action(adminService.banUser, u._id)}
                            className="text-xs px-2 py-1 rounded transition-colors"
                            style={{ color: "#f97316", border: "1px solid #f97316" }}>
                            Ban
                          </button>
                        )
                      )}
                      {!u.is_admin && (
                        <button onClick={() => { if (confirm("Delete this user?")) action(adminService.deleteUser, u._id); }}
                          className="text-xs px-2 py-1 rounded transition-colors"
                          style={{ color: "#ef4444", border: "1px solid #ef4444" }}>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center py-10 text-sm" style={{ color: "var(--text-muted)" }}>No users found.</p>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminUsers;