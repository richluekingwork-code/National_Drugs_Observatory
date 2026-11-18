import { Navigate, Outlet } from "react-router-dom";
import { useRoles } from "../hooks/useRoles";

/**
 * Route-level convenience guard. If the user lacks the role, they are
 * redirected. The server still enforces on every request.
 */
export default function RequireRole({ role, children }) {
  const roles = useRoles();
  const allowed = Boolean(roles[role]);

  if (!allowed) {
    return <Navigate to="/" replace />;
  }
  return children ?? <Outlet />;
}