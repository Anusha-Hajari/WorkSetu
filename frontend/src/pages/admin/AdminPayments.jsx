import AdminLayout from "../../components/admin/AdminLayout";

function AdminPayments() {
  return (
    <AdminLayout>
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Payments</h1>
      <div className="card p-10 text-center">
        <div className="text-3xl mb-3">💳</div>
        <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
          Payment ledger coming soon
        </div>
        <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Will show all Razorpay transactions once payment integration is live.
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminPayments;