import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_ADMIN } from "../../../config/api";
import { getAdminToken } from "../../../utils/adminAuth";

function authHeaders() {
  const token = getAdminToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function money(amount) {
  return `$${Number(amount || 0).toLocaleString("en-US")}`;
}

export default function AdminUserControl({ mode = "roi" }) {
  const isRoi = mode === "roi";
  const field = isRoi ? "roiStopped" : "withdrawStopped";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_ADMIN}/user-controls`, { headers: authHeaders() });
      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setRows([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((user) =>
      `${user.name || ""} ${user.email || ""} ${user.phone || ""} ${user.referralCode || ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [rows, search]);

  const toggle = async (user) => {
    const next = !user[field];
    const action = next ? "stop" : "resume";
    const label = isRoi ? "ROI" : "withdrawal";
    if (!window.confirm(`Are you sure you want to ${action} ${label} for ${user.name || "this user"}?`)) {
      return;
    }
    setActionId(user._id);
    try {
      await axios.patch(
        `${API_ADMIN}/users/${user._id}/controls`,
        { [field]: next },
        { headers: authHeaders() }
      );
      setRows((prev) =>
        prev.map((item) => (item._id === user._id ? { ...item, [field]: next } : item))
      );
    } catch (err) {
      alert(err?.response?.data?.message || "Could not update this user");
    }
    setActionId("");
  };

  return (
    <div className="admin-users-page">
      <div className="users-header-card">
        <div className="header-left">
          <div className="header-icon">
            <i className={isRoi ? "bi bi-graph-up-arrow" : "bi bi-cash-stack"}></i>
          </div>
          <div>
            <h2>{isRoi ? "Stop ROI" : "Stop Withdrawal"}</h2>
            <p>
              {isRoi
                ? "Stop or resume daily ROI for one user. Team ROI from that user also pauses."
                : "Stop or resume withdrawal requests for one user."}
            </p>
          </div>
        </div>
      </div>

      <div className="users-table-card">
        <div className="search-filter-row">
          <div className="search-wrapper">
            <i className="bi bi-search"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Search name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><h5>Loading...</h5></div>
        ) : (
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Investment</th>
                  <th>Crown</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7">No users found</td>
                  </tr>
                ) : (
                  filtered.map((user, index) => {
                    const stopped = Boolean(user[field]);
                    return (
                      <tr key={user._id}>
                        <td>{index + 1}</td>
                        <td>{user.name || "-"}</td>
                        <td>{user.phone || "-"}</td>
                        <td>{money(user.investmentAmount)}</td>
                        <td>{user.crown?.label || "No crown"}</td>
                        <td>{stopped ? "Stopped" : "Running"}</td>
                        <td>
                          <button
                            type="button"
                            className={`control-action-btn ${stopped ? "is-resume" : "is-stop"}`}
                            disabled={actionId === user._id}
                            onClick={() => toggle(user)}
                          >
                            {stopped
                              ? isRoi
                                ? "Resume ROI"
                                : "Resume Withdrawal"
                              : isRoi
                                ? "Stop ROI"
                                : "Stop Withdrawal"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
