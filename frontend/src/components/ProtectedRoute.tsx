import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  const location = useLocation();
  if (!token) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  return children;
}
