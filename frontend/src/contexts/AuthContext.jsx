import {
  createContext, useCallback, useContext, useEffect,
  useMemo, useState,
} from "react";
import { authService } from "../services/authService";
// 1. We added refreshAccessToken to the import here:
import { setAuthFailureHandler, refreshAccessToken } from "../api/apiClient";
import { clearTokens, getRefreshToken, REFRESH_KEY } from "../api/tokenStore";

const AuthContext = createContext(null);
const INSTITUTION_KEY = "ndo.currentInstitution";

function readStoredInstitution() {
  try {
    const raw = localStorage.getItem(INSTITUTION_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

function storeInstitution(id) {
  try {
    if (id != null) localStorage.setItem(INSTITUTION_KEY, String(id));
    else localStorage.removeItem(INSTITUTION_KEY);
  } catch { /* ignore */ }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  // "session_expired" | "logged_out" | null
  const [reason, setReason] = useState(null);
  const [currentInstitutionId, setCurrentInstitutionId] = useState(readStoredInstitution);

  const memberships = useMemo(
    () => (Array.isArray(user?.memberships) ? user.memberships : []),
    [user],
  );

  // Wipes everything tied to the previous session, including the selected institution.
  const signOutLocal = useCallback((why = "logged_out") => {
    clearTokens();
    storeInstitution(null);
    setCurrentInstitutionId(null);
    setUser(null);
    setStatus("unauthenticated");
    setReason(why);
  }, []);

  // Keep the selected institution valid for the current user's memberships.
  useEffect(() => {
    if (status === "loading") return; // don't validate before the session is restored

    if (memberships.length === 0) {
      if (currentInstitutionId !== null) {
        setCurrentInstitutionId(null);
        storeInstitution(null);
      }
      return;
    }

    const stillValid = memberships.some(
      (m) => m.institution?.id === currentInstitutionId,
    );
    if (!stillValid) {
      const first = memberships[0].institution?.id ?? null;
      setCurrentInstitutionId(first);
      storeInstitution(first);
    }
  }, [memberships, currentInstitutionId, status]);

  const switchInstitution = useCallback((id) => {
    setCurrentInstitutionId(id);
    storeInstitution(id);
  }, []);

  const currentMembership = useMemo(
    () => memberships.find((m) => m.institution?.id === currentInstitutionId) ?? null,
    [memberships, currentInstitutionId],
  );

  const rolesInCurrentInstitution = useMemo(() => {
    const role = currentMembership?.role;
    return role ? [role] : [];
  }, [currentMembership]);

  // apiClient calls this when refresh fails mid-session.
  useEffect(() => {
    setAuthFailureHandler(() => signOutLocal("session_expired"));
  }, [signOutLocal]);

  // Boot: restore the session if a refresh token exists.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!getRefreshToken()) {
        storeInstitution(null);
        setCurrentInstitutionId(null);
        setUser(null);
        setStatus("unauthenticated");
        setReason(null);
        return;
      }

      try {
        // 2. Await the refresh token FIRST to get a valid access token
        await refreshAccessToken();
        
        // 3. Now safely fetch the user data (no 401 will happen)
        const me = await authService.me();
        
        if (cancelled) return;
        setUser(me);
        setStatus("authenticated");
        setReason(null);
      } catch (err) {
        if (cancelled) return;
        
        // If the token is invalid or user was deleted, wipe it clean
        clearTokens();
        storeInstitution(null);
        setCurrentInstitutionId(null);
        setUser(null);
        setStatus("unauthenticated");
        setReason(null);
      }
    }

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  // Multi-tab: another tab removed the refresh token, so we log out too.
  useEffect(() => {
    function onStorage(e) {
      if (e.key === REFRESH_KEY && e.newValue === null) {
        signOutLocal("logged_out");
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [signOutLocal]);

  useEffect(() => {
    async function onRefreshMe() {
      try {
        const me = await authService.me();
        setUser(me);
      } catch { /* ignore, session may have expired */ }
    }
    window.addEventListener("auth:refresh-me", onRefreshMe);
    return () => window.removeEventListener("auth:refresh-me", onRefreshMe);
  }, []);

  const login = useCallback(async ({ identifier, password }) => {
    // Never inherit the previous user's institution.
    storeInstitution(null);
    setCurrentInstitutionId(null);

    const { user: authenticatedUser } = await authService.login({ identifier, password });

    setUser(authenticatedUser);
    setStatus("authenticated");
    setReason(null);

    return authenticatedUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      signOutLocal("logged_out");
    }
  }, [signOutLocal]);

  const value = useMemo(
    () => ({
      user,
      status,
      reason,
      login,
      logout,
      memberships,
      currentInstitutionId,
      currentMembership,
      switchInstitution,
      rolesInCurrentInstitution,
    }),
    [
      user, status, reason, login, logout,
      memberships, currentInstitutionId, currentMembership,
      switchInstitution, rolesInCurrentInstitution,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}