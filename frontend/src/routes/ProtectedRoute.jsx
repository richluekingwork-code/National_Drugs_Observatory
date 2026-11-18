import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { status, reason } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="min-h-dvh grid place-items-center bg-base-100">
        <span className="loading loading-spinner loading-md text-primary" aria-label="Loading" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    // After a deliberate logout, don't remember the page. Deep links and
    // expired sessions still keep `next`.
    if (reason === "logged_out") {
      return <Navigate to="/login" replace />;
    }

    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return children ?? <Outlet />;
}