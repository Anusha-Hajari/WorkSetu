import React from "react";
import { useLocation } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import PostJob from "./pages/PostJob";
import Apply from "./pages/Apply";
import Payment from "./pages/Payment";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import MyBookings from "./pages/MyBookings";
import MyApplications from "./pages/MyApplications";
import MyPosts from "./pages/MyPosts";
import Payments from "./pages/Payments";
import Schedule from "./pages/Schedule";
import HowItWorks from "./pages/HowItWorks";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import AdminLogin from "./pages/admin/AdminLogin";
import WalletPage from "./pages/WalletPage";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminJobs from "./pages/admin/AdminJobs";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminDisputes from "./pages/admin/AdminDisputes";
import AdminAiAudit from "./pages/admin/AdminAiAudit";
import PetalEffect from "./components/PetalEffect";
import ChatPage from "./pages/ChatPage";
import Tracking from "./pages/Tracking";
import { useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import socket from "./services/socket";
import NotificationToast from "./components/NotificationToast";

function App() {
  const location = useLocation();
  const { user } = useAuth();

  // Connect to global user room for notifications
  useEffect(() => {
    if (user?.id) {
      socket.emit("join", user.id);
    }
  }, [user?.id]);

  // Hide navbar on all admin pages and auth pages
  const hideNavbar =
    location.pathname.startsWith("/admin") ||
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)" }}>
      {(location.pathname === "/login" || location.pathname === "/register") && <PetalEffect />}
      <NotificationToast />
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/jobs"        element={<Jobs />} />
        <Route path="/wallet"      element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
        <Route path="/jobs/:id"    element={<JobDetails />} />
        <Route path="/login"       element={<Login />} />
        <Route path="/register"    element={<Register />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/post-job"    element={<ProtectedRoute><PostJob /></ProtectedRoute>} />
        <Route path="/apply/:id"   element={<ProtectedRoute><Apply /></ProtectedRoute>} />
        <Route path="/payment/:id" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile"     element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="/my-applications" element={<ProtectedRoute><MyApplications /></ProtectedRoute>} />
        <Route path="/my-posts"    element={<ProtectedRoute><MyPosts /></ProtectedRoute>} />
        <Route path="/payments"    element={<ProtectedRoute><Payments /></ProtectedRoute>} />
        <Route path="/schedule"    element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin"       element={<AdminRoute><AdminOverview /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/jobs"  element={<AdminRoute><AdminJobs /></AdminRoute>} />
        <Route path="/admin/bookings" element={<AdminRoute><AdminBookings /></AdminRoute>} />
        <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
        <Route path="/admin/disputes" element={<AdminRoute><AdminDisputes /></AdminRoute>} />
        <Route path="/admin/ai-audit" element={<AdminRoute><AdminAiAudit /></AdminRoute>} />
        <Route path="/chat/:jobId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/tracking/:bookingId" element={<ProtectedRoute><Tracking /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

export default App;