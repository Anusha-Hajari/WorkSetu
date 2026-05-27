import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";

function DropdownMenu({ label, items, location }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = items.some((item) => location.pathname === item.to);

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setOpen(!open)}
        className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 rounded-full ${
          isActive ? "text-[var(--gold)] bg-[var(--accent-soft)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        }`}
      >
        {label}
        <svg className={`w-2.5 h-2.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 glass-card min-w-[200px] p-1.5 shadow-2xl animate-fade-up border border-[var(--border-color)]">
          {items.map((item) => (
            <Link 
              key={item.to} 
              to={item.to} 
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all duration-200 ${
                location.pathname === item.to 
                  ? "text-[var(--accent-text)] bg-[var(--accent-soft)]" 
                  : "text-[var(--text-muted)] hover:bg-[var(--border-color)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span className="text-sm opacity-80">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button 
      onClick={toggle}
      className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border border-[var(--border-color)] bg-[var(--bg-surface)] backdrop-blur-md hover:border-[var(--gold)] group"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <svg className="w-4 h-4 text-zinc-400 group-hover:text-[var(--gold)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14A7 7 0 0012 5z"/>
        </svg>
      ) : (
        <svg className="w-4 h-4 text-zinc-500 group-hover:text-[var(--gold)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
        </svg>
      )}
    </button>
  );
}

function UserMenu({ user, logout, navigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 p-1 rounded-full transition-all duration-300 border border-transparent hover:border-[var(--border-color)] bg-transparent hover:bg-[var(--bg-surface)]"
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-black shadow-lg"
          style={{ background: "var(--accent)" }}>
          {user.name?.[0]?.toUpperCase()}
        </div>
        <span className="text-[11px] font-bold tracking-widest uppercase hidden sm:block text-[var(--text-primary)]">
          {user.name?.split(" ")[0]}
        </span>
        <svg className={`w-3 h-3 transition-transform duration-300 mr-1 ${open ? "rotate-180" : ""}`} style={{ color: "var(--text-hint)" }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 z-50 glass-card min-w-[240px] p-1.5 shadow-2xl animate-fade-up border border-[var(--border-color)]">
          <div className="px-4 py-3 mb-1 border-b border-[var(--border-color)]">
            <div className="text-[11px] font-black tracking-widest uppercase text-[var(--text-primary)]">{user.name}</div>
            <div className="text-[10px] tracking-tight text-[var(--text-muted)] lowercase mt-0.5">{user.email}</div>
          </div>

          <div className="py-1">
            <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-[11px] font-bold tracking-wider uppercase hover:bg-[var(--accent-soft)] transition-all">
              <span className="text-sm opacity-60">📊</span> Dashboard
            </Link>
            <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-[11px] font-bold tracking-wider uppercase hover:bg-[var(--accent-soft)] transition-all">
              <span className="text-sm opacity-60">👤</span> Profile
            </Link>
            <Link to="/my-bookings" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-[11px] font-bold tracking-wider uppercase hover:bg-[var(--accent-soft)] transition-all">
              <span className="text-sm opacity-60">📅</span> My Work
            </Link>
          </div>

          <div className="h-px bg-[var(--border-color)] my-1" />
          
          <button 
            onClick={() => { logout(); navigate("/"); setOpen(false); }}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-[11px] font-bold tracking-wider uppercase text-red-500 hover:bg-red-500/10 transition-all"
          >
            <span className="text-sm opacity-80">🚪</span> Logout
          </button>
        </div>
      )}
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const jobsItems = [
    { label: "Browse Jobs", to: "/jobs", icon: "🔍" },
    { label: "Post a Job", to: "/post-job", icon: "📋" },
    { label: "My Applications", to: "/my-applications", icon: "📨" },
    { label: "My Job Posts", to: "/my-posts", icon: "📌" },
  ];

  const bookingItems = [
    { label: "My Bookings", to: "/my-bookings", icon: "📅" },
    { label: "Active Tracking", to: "/my-bookings", icon: "📍" },
    { label: "My Schedule", to: "/schedule", icon: "🗓" },
  ];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
      scrolled ? "py-2" : "py-5"
    }`}>
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500 ${
        scrolled ? "glass-card border border-[var(--border-color)] shadow-xl" : ""
      }`}>
        <div className="relative flex items-center justify-between h-14">
          
          {/* Left Side: Desktop Nav */}
          <div className="flex-1 flex items-center justify-start">
            <div className="hidden md:flex items-center gap-1">
              <Link to="/" className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 rounded-full ${
                location.pathname === "/" ? "text-[var(--gold)] bg-[var(--accent-soft)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}>Home</Link>
              <DropdownMenu label="Jobs" items={jobsItems} location={location} />
              <DropdownMenu label="Bookings" items={bookingItems} location={location} />
            </div>
          </div>

          {/* Center: Logo (Absolute Positioning for Perfect Balance) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <Link to="/" className="flex items-center gap-2 group whitespace-nowrap">
              <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] font-black transition-all duration-500 group-hover:scale-110 group-hover:rotate-[15deg] shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                style={{
                  background: "var(--accent)",
                  color: "#000",
                  clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                }}>⟡</div>
              <span className="text-lg sm:text-xl font-black tracking-[0.1em] uppercase"
                style={{ color: "var(--text-primary)", fontFamily: "'Cinzel', serif" }}>
                Work<span className="text-[var(--gold)]">Setu</span>
              </span>
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex-1 flex items-center justify-end gap-2 sm:gap-4">
            <div className="hidden lg:flex items-center gap-4">
               <Link to="/payments" className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 rounded-full ${
                 location.pathname === "/payments" ? "text-[var(--gold)] bg-[var(--accent-soft)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
               }`}>Payments</Link>
            </div>
            
            <div className="hidden md:block">
               <ThemeToggle />
            </div>

            {user ? (
              <UserMenu user={user} logout={logout} navigate={navigate} />
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all">Login</Link>
                <Link to="/register" className="btn-primary py-2 px-6 text-[10px]">Join</Link>
              </div>
            )}
            
            {/* Mobile Toggle */}
            <div className="md:hidden flex items-center gap-2">
               <ThemeToggle />
               <button 
                 onClick={() => setMobileOpen(!mobileOpen)}
                 className="w-9 h-9 rounded-full flex items-center justify-center border border-[var(--border-color)] bg-[var(--bg-surface)]"
               >
                 <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   {mobileOpen ? <path d="M6 18L18 6M6 6l12 12"/> : <path d="M4 6h16M4 12h16M4 18h16"/>}
                 </svg>
               </button>
            </div>
          </div>

        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden py-6 space-y-2 animate-fade-up border-t border-[var(--border-color)] mt-2">
            {[
              { label: "Home", to: "/" },
              { label: "Jobs", to: "/jobs" },
              { label: "My Applications", to: "/my-applications" },
              { label: "Payments", to: "/payments" },
              ...(user ? [{ label: "Dashboard", to: "/dashboard" }, { label: "Profile", to: "/profile" }] : []),
            ].map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-xl text-xs font-bold tracking-widest uppercase transition-all ${
                  location.pathname === l.to ? "text-[var(--gold)] bg-[var(--accent-soft)]" : "text-[var(--text-muted)]"
                }`}>
                {l.label}
              </Link>
            ))}
            {!user && (
              <div className="pt-4 flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary text-center">Login</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary text-center">Join Free</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;