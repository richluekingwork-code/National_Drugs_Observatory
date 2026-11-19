import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import LoginForm from "../components/auth/LoginForm";
import PilotQuickLogin from "../components/auth/PilotQuickLogin";
import { useAuth } from "../contexts/AuthContext";

// PILOT ONLY: set VITE_PILOT_LOGIN="false" at build time to hide the panel.
const SHOW_PILOT_LOGIN = import.meta.env.VITE_PILOT_LOGIN !== "false";

/**
 * Accepts a `next` query parameter and validates it as a safe,
 * same-origin path before using it. Prevents open-redirect abuse.
 */
function safeNext(search, fallback = "/") {
  const params = new URLSearchParams(search);
  const next = params.get("next");
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, reason } = useAuth();

  // Already-authenticated users should not sit on the login screen.
  useEffect(() => {
    if (status === "authenticated") {
      navigate(safeNext(location.search), { replace: true });
    }
  }, [status, navigate, location.search]);

  const handleSuccess = () => {
    navigate(safeNext(location.search), { replace: true });
  };
  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          Welcome back.
        </h2>
        <p className="mt-1.5 text-sm text-base-content/60">
          Sign in to access the observatory console.
        </p>
      </div>
        {reason === "session_expired" && (
          <div
            role="status"
            className="mb-6 rounded-[--radius-field] border border-warning/30 bg-warning/10 px-3.5 py-3 text-sm text-warning-content"
          >
            Your session expired. Please sign in again.
          </div>
        )}
      <LoginForm onSuccess={handleSuccess} />

      {SHOW_PILOT_LOGIN && <PilotQuickLogin onSuccess={handleSuccess} />}

      <p className="mt-8 text-center text-[11px] text-base-content/40">
        Authorized personnel only. All activity is logged.
      </p>
    </AuthLayout>
  );
}