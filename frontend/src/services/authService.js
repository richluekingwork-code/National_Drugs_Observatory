import { apiClient } from "../api/apiClient";
import {
  setAccessToken,
  setRefreshToken,
  getRefreshToken,
  clearTokens,
} from "../api/tokenStore";

const LoginError = {
  InvalidCredentials: "invalid_credentials",
  RateLimited: "rate_limited",
  Network: "network",
  Server: "server",
  Unknown: "unknown",
};

/**
 * Maps any axios error into a stable shape the UI can reason about.
 * Deliberately does not surface server-supplied field names or stacks.
 */
function classifyError(error) {
  if (!error.response) {
    return {
      kind: LoginError.Network,
      message: "Cannot reach the server. Check your connection and try again.",
    };
  }
  const { status, data } = error.response;

  if (status === 429) {
    return {
      kind: LoginError.RateLimited,
      message: "Too many attempts. Please wait a moment and try again.",
    };
  }
  if (status === 400 || status === 401) {
    // Backend returns generic message; do not echo field-level details
    // that could aid account enumeration.
    return {
      kind: LoginError.InvalidCredentials,
      message: "Invalid credentials.",
    };
  }
  if (status === 403) {
    return {
      kind: LoginError.InvalidCredentials,
      message: "Sign-in is not permitted for this account.",
    };
  }
  if (status >= 500) {
    return {
      kind: LoginError.Server,
      message: "The service is temporarily unavailable. Try again shortly.",
    };
  }
  return {
    kind: LoginError.Unknown,
    message: "Something went wrong. Please try again.",
  };
}

export const authService = {
  async login({ identifier, password }) {
    try {
      const { data } = await apiClient.post("/api/login/", {
        identifier,
        password,
      });
      setAccessToken(data.access);
      if (data.refresh) setRefreshToken(data.refresh);
      return { user: data.user };
    } catch (error) {
      throw classifyError(error);
    }
  },

  async me() {
    const { data } = await apiClient.get("/api/me/");
    return data;
  },

  async logout() {
    const refresh = getRefreshToken();
    try {
      await apiClient.post("/api/logout/", { refresh });
    } catch {
      // Logout is best-effort client-side; token is cleared regardless.
    } finally {
      clearTokens();
    }
  },

  LoginError,
};