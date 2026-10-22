const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_META_KEY = "admin_auth";

export function getAdminToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setAdminSession(token, meta = null) {
  try {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
    else localStorage.removeItem(ADMIN_TOKEN_KEY);
    if (meta && typeof meta === "object") {
      localStorage.setItem(ADMIN_META_KEY, JSON.stringify(meta));
    } else if (!token) {
      localStorage.removeItem(ADMIN_META_KEY);
    }
  } catch {
  }
}

export function clearAdminSession() {
  setAdminSession("", null);
}

export function isAdminLoggedIn() {
  return Boolean(getAdminToken());
}
