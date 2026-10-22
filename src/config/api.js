/**
 * Central API URLs from `.env` (Create React App exposes only `REACT_APP_*`).
 *
 * REACT_APP_API_BASE — backend root, e.g. http://localhost:5000/api
 * REACT_APP_SITE_URL — optional; public URL of this app for referral links (defaults to window.location.origin)
 */

function trimTrailingSlashes(s) {
  return String(s || "").replace(/\/+$/, "");
}

export const API_BASE = trimTrailingSlashes(
  process.env.REACT_APP_API_BASE || "https://salesgrowbackend.onrender.com"
);

export const API_AUTH = `${API_BASE}/auth`;
export const API_CHAT = `${API_BASE}/chat`;
/** Admin panel: `/api/admin` — -  uses `admin_token` and separate login fields. */
export const API_ADMIN = `${API_BASE}/admin`;

/** Server origin without /api (for absolute sticker/image URLs). */
export function getApiOrigin(apiBaseUrl = API_BASE) {
  return trimTrailingSlashes(String(apiBaseUrl || "").trim()).replace(/\/api\/?$/, "");
}

/** Origin used in shared referral signup links. */
export function getSiteOrigin() {
  const fromEnv = process.env.REACT_APP_SITE_URL || process.env.REACT_APP_PUBLIC_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return trimTrailingSlashes(fromEnv);
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

/** Back-compat alias (older Referral.jsx used this name). */
export const getPublicSiteOrigin = getSiteOrigin;
