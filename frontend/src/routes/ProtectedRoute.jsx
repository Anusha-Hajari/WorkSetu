import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Loader from "../components/Loader";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader fullPage />;
  return user ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;