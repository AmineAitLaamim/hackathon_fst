import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth.js";

export default function ProtectedRoute() {
  const location = useLocation();
  const { bootstrapping, isAuthenticated } = useAuth();

  if (bootstrapping) {
    return <div className="screen-message">Preparing your Marrakech routes...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
