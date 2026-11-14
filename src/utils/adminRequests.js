export const ADMIN_REQUESTS_CHANGED = "admin-requests-changed";

export function notifyAdminRequestsChanged() {
  window.dispatchEvent(new Event(ADMIN_REQUESTS_CHANGED));
}
