import Footer from "../components/Footer";

const STEPS = [
  { icon: "👤", title: "Create one account", desc: "Sign up once. Your account works for both hiring people and finding work — no role selection needed." },
  { icon: "📋", title: "Post or browse jobs", desc: "Post a job with skill, rate, and time requirements. Or browse available jobs and apply in one click." },
  { icon: "📅", title: "Book a slot", desc: "Choose a date and time that works. Hourly sessions or long-term contracts — fully flexible." },
  { icon: "📍", title: "Track in real time", desc: "Once work starts, follow live status updates as the worker checks in, progresses, and completes." },
  { icon: "💳", title: "Pay securely", desc: "Payments go through Razorpay. Funds are released only after job confirmation." },
  { icon: "⚡", title: "AI recommendations", desc: "Our AI scores and ranks the best matches for your job based on skills, rating, and location." },
];

function HowItWorks() {
  return (
    <div className="pt-24 pb-0" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold" style={{ color: "var(--text-primary)" }}>How WorkSetu Works</h1>
          <p className="mt-3 text-lg" style={{ color: "var(--text-muted)" }}>
            From posting to payment in a few simple steps.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {STEPS.map((s, i) => (
            <div key={i} className="card p-6 flex gap-4">
              <div className="text-2xl shrink-0">{s.icon}</div>
              <div>
                <div className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>{s.title}</div>
                <div className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
export default HowItWorks;