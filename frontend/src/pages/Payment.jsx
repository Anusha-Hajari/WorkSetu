import { useParams, useNavigate } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import Loader from "../components/Loader";

function Payment() {
  const { id } = useParams();
  const { data: booking, loading } = useFetch(`/api/bookings/${id}`);
  const navigate = useNavigate();

  const handlePay = async () => {
    alert("Payment integration will connect once backend is ready.");
    navigate("/jobs");
  };

  if (loading) return <Loader fullPage />;

  return (
    <div className="pt-24 px-4 max-w-md mx-auto pb-16">
      <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--text-primary)" }}>
        Complete Payment
      </h1>
      <div className="card p-6">
        <div className="space-y-3 mb-6">
          {[
            ["Service", booking?.job_title || "Job Booking"],
            ["Type", booking?.type || "—"],
            ["Slot", booking?.date ? `${booking.date} at ${booking.time}` : "—"],
            ["Amount", booking?.amount ? `₹${booking.amount}` : "—"],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between text-sm">
              <span style={{ color: "var(--text-muted)" }}>{label}</span>
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>{val}</span>
            </div>
          ))}
        </div>
        <div className="pt-4 mb-6" style={{ borderTop: "1px solid var(--border-color)" }}>
          <div className="flex justify-between font-semibold">
            <span style={{ color: "var(--text-muted)" }}>Total</span>
            <span style={{ color: "var(--accent-text)" }}>
              {booking?.amount ? `₹${booking.amount}` : "—"}
            </span>
          </div>
        </div>
        <button onClick={handlePay} className="btn-primary w-full">
          Pay with Razorpay
        </button>
        <p className="text-xs text-center mt-3" style={{ color: "var(--text-hint)" }}>
          Secured by Razorpay · End-to-end encrypted
        </p>
      </div>
    </div>
  );
}

export default Payment;