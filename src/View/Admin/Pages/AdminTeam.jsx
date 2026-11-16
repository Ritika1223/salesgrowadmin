import React, { useMemo, useState } from "react";
import axios from "axios";
import { API_ADMIN } from "../../../config/api";
import { getAdminToken } from "../../../utils/adminAuth";
import UserIdLink from "../Componets/UserIdLink";

function authHeaders() {
  const token = getAdminToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function AdminTeam({ mode = "upline" }) {
  const isUpline = mode === "upline";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [levelFilter, setLevelFilter] = useState("all");
  const [searched, setSearched] = useState(false);

  const levels = useMemo(() => {
    const values = [...new Set(members.map((row) => row.level).filter(Boolean))];
    values.sort((a, b) => a - b);
    return values;
  }, [members]);

  const visible = useMemo(() => {
    if (levelFilter === "all") return members;
    return members.filter((row) => String(row.level) === String(levelFilter));
  }, [members, levelFilter]);

  const search = async (event) => {
    event.preventDefault();
    const id = code.trim();
    if (!id) {
      setError("Enter a user ID");
      return;
    }
    setLoading(true);
    setError("");
    setSearched(true);
    setLevelFilter("all");
    try {
      const res = await axios.get(`${API_ADMIN}/team/${isUpline ? "upline" : "downline"}`, {
        headers: authHeaders(),
        params: { id },
      });
      setUser(res.data?.user || null);
      if (isUpline) {
        setMembers(Array.isArray(res.data?.members) ? res.data.members : []);
      } else {
        const rows = [];
        (res.data?.levels || []).forEach((level) => {
          (level.members || []).forEach((member) => rows.push(member));
        });
        setMembers(rows);
      }
    } catch (err) {
      setUser(null);
      setMembers([]);
      setError(err?.response?.data?.message || "Could not load this team");
    }
    setLoading(false);
  };

  return (
    <div className="admin-users-page">
      <div className="users-header-card">
        <div className="header-left">
          <div className="header-icon">
            <i className={isUpline ? "bi bi-diagram-3-fill" : "bi bi-diagram-2-fill"}></i>
          </div>
          <div>
            <h2>{isUpline ? "Upline" : "Downline"}</h2>
            <p>
              {isUpline
                ? "Members above this ID, from the direct sponsor upward"
                : "Members below this ID, level by level through referral"}
            </p>
          </div>
        </div>
      </div>

      <div className="users-table-card">
        <form className="search-filter-row" onSubmit={search}>
          <div className="search-wrapper">
            <i className="bi bi-search"></i>
            <input
              className="search-input"
              placeholder="Enter user ID, for example KKW123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <button type="submit" className="dashboard-btn" disabled={loading}>
            {loading ? "Loading..." : "Show team"}
          </button>
        </form>

        {error ? <div className="empty-state">{error}</div> : null}

        {user ? (
          <div className="team-selected-user">
            <span>Selected ID</span>
            <UserIdLink user={user} />
            <strong>{user.name || "-"}</strong>
            <span>{user.phone || "-"}</span>
            <span>{user.plan || "No package"}</span>
          </div>
        ) : null}

        {user && !isUpline ? (
          <div className="filter-wrapper team-level-filter">
            <select
              className="status-filter"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option value="all">All levels ({members.length})</option>
              {levels.map((level) => {
                const count = members.filter((row) => row.level === level).length;
                return (
                  <option key={level} value={String(level)}>
                    Level {level} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        ) : null}

        {loading ? (
          <div className="empty-state">Loading team...</div>
        ) : searched && user ? (
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Level</th>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Package</th>
                  <th>{isUpline ? "Position" : "Referred by"}</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan="9">
                      {isUpline
                        ? "This user has no upline"
                        : "This user has no downline"}
                    </td>
                  </tr>
                ) : (
                  visible.map((row, index) => (
                    <tr key={row._id}>
                      <td>{index + 1}</td>
                      <td>{row.level}</td>
                      <td><UserIdLink user={row} /></td>
                      <td>{row.name || "-"}</td>
                      <td>{row.phone || "-"}</td>
                      <td>{row.plan || "No package"}</td>
                      <td>
                        {isUpline ? (
                          row.level === 1 ? "Direct sponsor" : `${row.level} steps above`
                        ) : row.referredBy ? (
                          <UserIdLink user={row.referredBy} />
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{row.isActive ? "Active" : "Inactive"}</td>
                      <td>
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleDateString("en-IN")
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
