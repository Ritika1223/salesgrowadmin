import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_ADMIN } from "../../../config/api";
import { getAdminToken } from "../../../utils/adminAuth";

function authHeaders() {
  const t = getAdminToken();
  return {
    "Content-Type": "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}

export default function AdminCoinWithdrawals() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_ADMIN}/coin-withdrawals`, { headers: authHeaders() });
      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setRows([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    const verb = status === "approved" ? "accept" : "reject";
    if (!window.confirm(`Are you sure you want to ${verb} this coin withdrawal?`)) {
      return;
    }
    setActionLoading(id + status);
    try {
      await axios.patch(
        `${API_ADMIN}/coin-withdrawals/${id}/status`,
        { status },
        { headers: authHeaders() }
      );
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || "Action failed");
    }
    setActionLoading(null);
  };

  return (
    <div className="admin-users-page">
      <div className="users-header-card">
        <div className="header-left">
          <div className="header-icon">
            <i className="bi bi-coin"></i>
          </div>
          <div>
            <h2>Coin Withdrawals</h2>
            <p>Accept or reject coin withdrawal requests. Minimum is 500 coins.</p>
          </div>
        </div>
      </div>
      <div className="users-table-card">
        {loading ? (
          <div className="empty-state"><h5>Loading...</h5></div>
        ) : (
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>User</th>
                  <th>Coins</th>
                  <th>UPI / USDT</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No coin withdrawal requests</td>
                  </tr>
                ) : (
                  rows.map((row, index) => {
                    const user = row.userId && typeof row.userId === "object" ? row.userId : {};
                    return (
                      <tr key={row._id}>
                        <td>{index + 1}</td>
                        <td>{user.nickname || user.name || "-"}</td>
                        <td>{Number(row.amount || 0).toLocaleString()}</td>
                        <td>{row.payoutAddress}</td>
                        <td>{row.status}</td>
                        <td>{row.createdAt ? new Date(row.createdAt).toLocaleString("en-IN") : "-"}</td>
                        <td>
                          {row.status === "pending" && (
                            <div className="action-buttons">
                              <button
                                className="approve-btn"
                                disabled={actionLoading === row._id + "approved"}
                                onClick={() => updateStatus(row._id, "approved")}
                              >
                                Accept
                              </button>
                              <button
                                className="decline-btn"
                                disabled={actionLoading === row._id + "rejected"}
                                onClick={() => updateStatus(row._id, "rejected")}
                              >
                                Reject
                              </button>
                            </div>
                          )}
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
