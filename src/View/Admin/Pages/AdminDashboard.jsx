      import React, { useCallback, useEffect, useMemo, useState } from "react";
      import { useNavigate } from "react-router-dom";
      import { API_ADMIN, API_BASE, getApiOrigin } from "../../../config/api";
      import { clearAdminSession, getAdminToken } from "../../../utils/adminAuth";
      function authHeaders() {
        const t = getAdminToken();
        return {
          "Content-Type": "application/json",
          ...(t ? { Authorization: `Bearer ${t}` } : {})
        };
      }
      export default function AdminDashboard() {
        const navigate = useNavigate();
        const apiOrigin = useMemo(() => getApiOrigin(API_BASE), []);
        const [users, setUsers] = useState([]);
        const [groups, setGroups] = useState([]);
        const [stickers, setStickers] = useState([]);
        const [loading, setLoading] = useState({ users: true, groups: true, stickers: true });
        const [error, setError] = useState("");
        const [stickerForm, setStickerForm] = useState({
          name: "",
          slug: "",
          imageUrl: "",
          cost: "",
          isCustom: true
        });
        const [savingSticker, setSavingSticker] = useState(false);
        const [stickerMsg, setStickerMsg] = useState("");

        const loadAll = useCallback(async () => {
          setError("");
          const headers = authHeaders();
          if (!headers.Authorization) {
            navigate("/admin/login", { replace: true });
            return;
          }

          setLoading({ users: true, groups: true, stickers: true });

          const [uRes, gRes, sRes] = await Promise.all([
            fetch(`${API_ADMIN}/users`, { headers }),
            fetch(`${API_ADMIN}/groups`, { headers }),
            fetch(`${API_ADMIN}/stickers`, { headers })
          ]);

          if (uRes.status === 401 || gRes.status === 401 || sRes.status === 401) {
            clearAdminSession();
            navigate("/admin/login", { replace: true });
            return;
          }

          try {
            const uJson = await uRes.json().catch(() => ({}));
            const gJson = await gRes.json().catch(() => ({}));
            const sJson = await sRes.json().catch(() => ({}));

            if (!uRes.ok) throw new Error(uJson.message || "Users request failed");
            if (!gRes.ok) throw new Error(gJson.message || "Groups request failed");
            if (!sRes.ok) throw new Error(sJson.message || "Stickers request failed");

            setUsers(Array.isArray(uJson.users) ? uJson.users : []);
            setGroups(Array.isArray(gJson.groups) ? gJson.groups : []);
            setStickers(Array.isArray(sJson.stickers) ? sJson.stickers : []);
          } catch (e) {
            setError(e.message || "Failed to load dashboard");
          } finally {
            setLoading({ users: false, groups: false, stickers: false });
          }
        }, [navigate]);

        useEffect(() => {
          loadAll();
        }, [loadAll]);

        const logout = () => {
          clearAdminSession();
          navigate("/admin/login", { replace: true });
        };

        const onStickerField = (e) => {
          const { name, value, type, checked } = e.target;
          setStickerForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
          }));
        };

        const submitSticker = async (e) => {
          e.preventDefault();
          setStickerMsg("");
          setSavingSticker(true);
          try {
            const res = await fetch(`${API_ADMIN}/stickers`, {
              method: "POST",
              headers: authHeaders(),
              body: JSON.stringify({
                name: stickerForm.name,
                slug: stickerForm.slug,
                imageUrl: stickerForm.imageUrl,
                cost: Number(stickerForm.cost),
                isCustom: stickerForm.isCustom
              })
            });
            const data = await res.json().catch(() => ({}));
            if (res.status === 401) {
              clearAdminSession();
              navigate("/admin/login", { replace: true });
              return;
            }
            if (!res.ok) {
              setStickerMsg(data.message || "Could not create sticker");
              setSavingSticker(false);
              return;
            }
            setStickerMsg("Sticker created.");
            setStickerForm({ name: "", slug: "", imageUrl: "", cost: "", isCustom: true });
            await loadAll();
          } catch (err) {
            setStickerMsg(err.message || "Network error");
          }
          setSavingSticker(false);
        };

        const absImage = (url) => {
          const raw = String(url || "").trim();
          if (!raw) return "";
          if (/^https?:\/\//i.test(raw)) return raw;
          const path = raw.startsWith("/") ? raw : `/${raw}`;
          return apiOrigin ? `${apiOrigin}${path}` : path;
        };

        return (


        <div className="admin-dashboard-section">

    <div className="users-header-card">

        <div className="header-left">

          <div className="header-icon">
            <i className="bi bi-speedometer2"></i>
          </div>

          <div>
            <h2>Admin Dashboard</h2>
            <p>Manage Users, Groups & Stickers</p>
          </div>

        </div>

        

      </div>


    {error && (
      <div className="cp-form-msg cp-form-msg--error mb-4">
        {error}
      </div>
    )}

    {/* Stats */}
    <div className="row g-4 mb-4">
      <div className="col-xl-4 col-md-4">
        <div className="stats-card">
          <h6>Total Users</h6>
          <h2>{users.length}</h2>
        </div>
      </div>

      <div className="col-xl-4 col-md-4">
        <div className="stats-card">
          <h6>Total Groups</h6>
          <h2>{groups.length}</h2>
        </div>
      </div>

      <div className="col-xl-4 col-md-4">
        <div className="stats-card">
          <h6>Total Stickers</h6>
          <h2>{stickers.length}</h2>
        </div>
      </div>
    </div>

</div>
        );
      }
