      import React, { useCallback, useEffect, useMemo, useState } from "react";
      import { useNavigate } from "react-router-dom";
      import { API_ADMIN, API_BASE, getApiOrigin } from "../../../config/api";
      import { clearAdminSession, getAdminToken } from "../../../utils/adminAuth";
      const FALLBACK_SETTINGS = {
        roiPercent: 1,
        levels: [
          { from: 1, to: 1, percent: 5 },
          { from: 2, to: 2, percent: 2 },
          { from: 3, to: 3, percent: 1 },
        ],
        roiToRoi: [
          { from: 1, to: 1, percent: 20 },
          { from: 2, to: 2, percent: 10 },
          { from: 3, to: 3, percent: 5 },
          { from: 4, to: 4, percent: 5 },
          { from: 5, to: 11, percent: 3 },
          { from: 12, to: 21, percent: 2 },
        ],
        salary: [
          { self: 100, leg: 1000, legs: 3, monthly: 50 },
          { self: 250, leg: 2500, legs: 3, monthly: 100 },
          { self: 500, leg: 5000, legs: 3, monthly: 200 },
          { self: 1000, leg: 10000, legs: 3, monthly: 500 },
        ],
      };

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
        const [settings, setSettings] = useState(null);
        const [editor, setEditor] = useState("");
        const [draft, setDraft] = useState(null);
        const [savingSettings, setSavingSettings] = useState(false);
        const [settingsMsg, setSettingsMsg] = useState("");

        const loadAll = useCallback(async () => {
          setError("");
          const headers = authHeaders();
          if (!headers.Authorization) {
            navigate("/admin/login", { replace: true });
            return;
          }

          setLoading({ users: true, groups: true, stickers: true });

          const [uRes, gRes, sRes, iRes] = await Promise.all([
            fetch(`${API_ADMIN}/users`, { headers }),
            fetch(`${API_ADMIN}/groups`, { headers }),
            fetch(`${API_ADMIN}/stickers`, { headers }),
            fetch(`${API_ADMIN}/income-settings`, { headers })
          ]);

          if (uRes.status === 401 || gRes.status === 401 || sRes.status === 401 || iRes.status === 401) {
            clearAdminSession();
            navigate("/admin/login", { replace: true });
            return;
          }

          try {
            const uJson = await uRes.json().catch(() => ({}));
            const gJson = await gRes.json().catch(() => ({}));
            const sJson = await sRes.json().catch(() => ({}));
            const iJson = await iRes.json().catch(() => ({}));

            if (!uRes.ok) throw new Error(uJson.message || "Users request failed");
            if (!gRes.ok) throw new Error(gJson.message || "Groups request failed");
            if (!sRes.ok) throw new Error(sJson.message || "Stickers request failed");

            setUsers(Array.isArray(uJson.users) ? uJson.users : []);
            setGroups(Array.isArray(gJson.groups) ? gJson.groups : []);
            setStickers(Array.isArray(sJson.stickers) ? sJson.stickers : []);
            if (iRes.ok && iJson.settings) setSettings(iJson.settings);
            else setSettings((current) => current || FALLBACK_SETTINGS);
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

        const openEditor = (kind) => {
          if (!settings) return;
          setSettingsMsg("");
          setEditor(kind);
          if (kind === "roi") setDraft(String(settings.roiPercent));
          if (kind === "level") setDraft(settings.levels.map((row) => ({ ...row })));
          if (kind === "roiToRoi") setDraft(settings.roiToRoi.map((row) => ({ ...row })));
          if (kind === "salary") setDraft(settings.salary.map((row) => ({ ...row })));
        };

        const saveSettings = async (event) => {
          event.preventDefault();
          setSavingSettings(true);
          setSettingsMsg("");
          const body = editor === "roi"
            ? { roiPercent: draft }
            : editor === "level"
              ? { levels: draft }
              : editor === "roiToRoi"
                ? { roiToRoi: draft }
                : { salary: draft };
          try {
            const res = await fetch(`${API_ADMIN}/income-settings`, {
              method: "PUT",
              headers: authHeaders(),
              body: JSON.stringify(body),
            });
            const data = await res.json().catch(() => ({}));
            if (res.status === 401) {
              clearAdminSession();
              navigate("/admin/login", { replace: true });
              return;
            }
            if (!res.ok) {
              setSettingsMsg(data.message || "Could not save");
              setSavingSettings(false);
              return;
            }
            setSettings(data.settings);
            setEditor("");
            setDraft(null);
          } catch (err) {
            setSettingsMsg(err.message || "Network error");
          }
          setSavingSettings(false);
        };

        const bandLabel = (row) => (
          row.from === row.to ? `Level ${row.from}` : `Level ${row.from}–${row.to}`
        );

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

    <div className="row g-4 mb-4">
      <div className="col-xl-3 col-md-6">
        <button type="button" className="stats-card" onClick={() => openEditor("roi")}>
          <h6>Daily ROI</h6>
          <h2>{settings ? `${settings.roiPercent}%` : "…"}</h2>
          <p>Click to change. Applies from today.</p>
        </button>
      </div>
      <div className="col-xl-3 col-md-6">
        <button type="button" className="stats-card" onClick={() => openEditor("level")}>
          <h6>Level percentage</h6>
          <h2>{settings ? `${settings.levels.map((row) => row.percent).join(" / ")}%` : "…"}</h2>
          <p>Direct and level income on a new fund.</p>
        </button>
      </div>
      <div className="col-xl-3 col-md-6">
        <button type="button" className="stats-card" onClick={() => openEditor("roiToRoi")}>
          <h6>ROI to ROI</h6>
          <h2>{settings ? `${settings.roiToRoi[0]?.percent}% – ${settings.roiToRoi[settings.roiToRoi.length - 1]?.percent}%` : "…"}</h2>
          <p>Percent of a member’s daily ROI paid up the team.</p>
        </button>
      </div>
      <div className="col-xl-3 col-md-6">
        <button type="button" className="stats-card" onClick={() => openEditor("salary")}>
          <h6>Salary</h6>
          <h2>{settings ? `$${settings.salary[0]?.monthly} – $${settings.salary[settings.salary.length - 1]?.monthly}` : "…"}</h2>
          <p>Monthly salary slabs. Click to edit.</p>
        </button>
      </div>
    </div>

    {editor && draft != null && (
      <div className="wallet-modal">
        <div className="wallet-modal-box income-settings-modal">
          <button
            className="wallet-close-btn"
            type="button"
            onClick={() => setEditor("")}
          >
            <i className="bi bi-x-lg"></i>
          </button>
          <h2>
            {editor === "roi" && "Daily ROI"}
            {editor === "level" && "Level percentage"}
            {editor === "roiToRoi" && "ROI to ROI"}
            {editor === "salary" && "Salary"}
          </h2>
          <p className="income-settings-note">
            The new rate applies from today for everyone. Payouts already calculated stay the same.
          </p>
          <form onSubmit={saveSettings}>
            {editor === "roi" && (
              <label>
                Daily ROI percent
                <input
                  className="wallet-input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  required
                />
              </label>
            )}
            {(editor === "level" || editor === "roiToRoi") && draft.map((row, index) => (
              <div className="income-settings-row" key={`${row.from}-${row.to}`}>
                <span>{bandLabel(row)}</span>
                <input
                  className="wallet-input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={row.percent}
                  onChange={(event) => {
                    const percent = event.target.value;
                    setDraft((current) => current.map((item, itemIndex) => (
                      itemIndex === index ? { ...item, percent } : item
                    )));
                  }}
                  required
                />
              </div>
            ))}
            {editor === "salary" && draft.map((slab, index) => (
              <div className="income-slab" key={`${slab.self}-${index}`}>
                <strong>Slab {index + 1} · {slab.legs} legs</strong>
                <label>
                  Own investment $
                  <input
                    className="wallet-input"
                    type="number"
                    min="0"
                    step="1"
                    value={slab.self}
                    onChange={(event) => {
                      const self = event.target.value;
                      setDraft((current) => current.map((item, itemIndex) => (
                        itemIndex === index ? { ...item, self } : item
                      )));
                    }}
                    required
                  />
                </label>
                <label>
                  Each leg team $
                  <input
                    className="wallet-input"
                    type="number"
                    min="0"
                    step="1"
                    value={slab.leg}
                    onChange={(event) => {
                      const leg = event.target.value;
                      setDraft((current) => current.map((item, itemIndex) => (
                        itemIndex === index ? { ...item, leg } : item
                      )));
                    }}
                    required
                  />
                </label>
                <label>
                  Monthly salary $
                  <input
                    className="wallet-input"
                    type="number"
                    min="0"
                    step="1"
                    value={slab.monthly}
                    onChange={(event) => {
                      const monthly = event.target.value;
                      setDraft((current) => current.map((item, itemIndex) => (
                        itemIndex === index ? { ...item, monthly } : item
                      )));
                    }}
                    required
                  />
                </label>
              </div>
            ))}
            {settingsMsg && <p className="wallet-error">{settingsMsg}</p>}
            <div className="wallet-modal-actions">
              <button type="button" className="wallet-cancel-btn" onClick={() => setEditor("")}>
                Cancel
              </button>
              <button type="submit" className="wallet-submit-btn" disabled={savingSettings}>
                {savingSettings ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

</div>
        );
      }
