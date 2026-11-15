import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { API_ADMIN, getUserSiteOrigin } from "../../../config/api";
import { clearAdminSession, getAdminToken } from "../../../utils/adminAuth";

export default function UserIdLink({ user }) {
  const navigate = useNavigate();
  const [opening, setOpening] = useState(false);
  const record = user && typeof user === "object" ? user : null;
  const userId = record?._id || record?.id || (typeof user === "string" ? user : "");
  const code = record?.referralCode || "";

  if (!userId) return <span>-</span>;

  const openLogin = async () => {
    if (record?.isDisabled) {
      Swal.fire(
        "Inactive account",
        "Activate this user before opening their login.",
        "info"
      );
      return;
    }

    const token = getAdminToken();
    if (!token) {
      navigate("/admin/login");
      return;
    }

    setOpening(true);
    try {
      const res = await fetch(`${API_ADMIN}/users/${userId}/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.token) {
        throw new Error(data.message || "Could not open this login");
      }

      const access = encodeURIComponent(
        JSON.stringify({ token: data.token, user: data.user })
      );
      const opened = window.open(
        `${getUserSiteOrigin()}/login#adminAccess=${access}`,
        "_blank"
      );
      if (!opened) {
        Swal.fire(
          "Popup blocked",
          "Allow popups for this site, then click the ID again.",
          "warning"
        );
      }
    } catch (err) {
      Swal.fire("Error", err.message || "Could not open this login", "error");
    } finally {
      setOpening(false);
    }
  };

  return (
    <button
      type="button"
      className="user-id-link"
      disabled={opening}
      title="Open this user's login"
      onClick={openLogin}
    >
      {opening ? "Opening..." : code || "Open"}
    </button>
  );
}
