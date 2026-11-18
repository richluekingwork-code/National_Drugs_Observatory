import axios from "axios";
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearTokens,
} from "./tokenStore";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const DEFAULT_TIMEOUT = 15000;
const UPLOAD_TIMEOUT = 60000; 

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  timeout: DEFAULT_TIMEOUT,
});

// ------------------------------------------------------------
// Single-flight refresh
// ------------------------------------------------------------
let refreshPromise = null;
let onAuthFailure = () => {};
export const setAuthFailureHandler = (fn) => { onAuthFailure = fn; };

async function performRefresh() {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("no_refresh_token");

  const { data } = await axios.post(
    `${API_BASE_URL}/api/refresh/`,
    { refresh },
    { headers: { "Content-Type": "application/json" } }
  );

  setAccessToken(data.access);
  if (data.refresh) setRefreshToken(data.refresh); // rotation
  return data.access;
}

// EXPORT THIS so AuthContext can call it on boot
export function refreshAccessToken() { 
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ------------------------------------------------------------
// Request interceptor: uploads, auth token, institution scope
// ------------------------------------------------------------
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const inst = localStorage.getItem("ndo.currentInstitution");
    if (inst) {
      const method = (config.method || "get").toLowerCase();
      const isWrite = ["post", "put", "patch", "delete"].includes(method);
      
      // Check if the current URL is an MOJ route
      const isMOJRoute = config.url?.includes("/moj/");

      // Only append institution_id if it is NOT an MOJ route
      if (!isMOJRoute) {
        if (isWrite) {
          if (config.data instanceof FormData) {
            config.params = { ...(config.params || {}), institution_id: inst };
          } else if (
            config.data && typeof config.data === "object" &&
            !Array.isArray(config.data) &&
            config.data.institution_id === undefined
          ) {
            config.data = { ...config.data, institution_id: Number(inst) };
          }
        } else {
          config.params = {
            ...(config.params || {}),
            institution_id: inst,
          };
        }
      }
    }
  } catch { /* ignore */ }

  return config;
});

// ------------------------------------------------------------
// Response interceptor: refresh once on 401, retry once
// ------------------------------------------------------------
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isRefreshCall = original?.url?.includes("/refresh/");
    const isMeCall = original?.url?.includes("/api/me/"); // Don't retry /me/ on boot

    if (status === 401 && original && !original._retried && !isRefreshCall && !isMeCall) {
      original._retried = true;
      try {
        const newToken = await refreshAccessToken();
        
        // Forcefully update the header with the NEW token before retrying
        original.headers.Authorization = `Bearer ${newToken}`;
        
        return apiClient(original);
      } catch {
        clearTokens();
        onAuthFailure();
      }
    }
    return Promise.reject(error);
  }
);