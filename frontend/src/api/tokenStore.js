/**
 * Access token lives in memory only. It is lost on page reload —
 * AuthContext re-hydrates it via the refresh token on boot.
 *
 * SECURITY NOTE
 * -------------
 * The refresh token is currently persisted in `localStorage`, which is
 * readable by any script on the origin. This is a known XSS trade-off.
 * The correct fix is to move the refresh token to an HttpOnly cookie
 * set by Django (see Security Review, Backend Patch A). Until that
 * ships, this storage is a documented limitation, not a design goal.
 */
let accessToken = null;

export const REFRESH_KEY = "ndo.refresh";

export const getAccessToken = () => accessToken;
export const setAccessToken = (t) => { accessToken = t; };

export const getRefreshToken = () => {
  try { return localStorage.getItem(REFRESH_KEY); }
  catch { return null; }
};

export const setRefreshToken = (t) => {
  try { localStorage.setItem(REFRESH_KEY, t); } catch { /* ignore */ }
};

export const clearTokens = () => {
  accessToken = null;
  try { localStorage.removeItem(REFRESH_KEY); } catch { /* ignore */ }
};

