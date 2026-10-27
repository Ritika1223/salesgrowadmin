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

export default function AdminWithdrawals({ reportOnly = false }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_ADMIN}/withdrawals`, { headers: authHeaders() });
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
    if (!window.confirm(`Are you sure you want to ${status === "approved" ? "approve" : "reject"} this withdrawal?`)) {
      return;
    }
    setActionLoading(id + status);
    try {
      await axios.patch(
        `${API_ADMIN}/withdrawals/${id}/status`,
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
            <i className="bi bi-cash-stack"></i>
          </div>
          <div>
            <h2>{reportOnly ? "Withdrawal Request Report" : "Withdrawal Requests"}</h2>
            <p>{reportOnly ? "All withdrawal requests" : "Approve or reject withdrawal requests"}</p>
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
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Payout</th>
                  <th>USDT Address(BEP20)</th>
                  <th>Status</th>
                  <th>Date</th>
                  {!reportOnly && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={reportOnly ? 7 : 8}>No withdrawal requests</td>
                  </tr>
                ) : (
                  rows.map((row, index) => {
                    const user = row.userId || {};
                    return (
                      <tr key={row._id}>
                        <td>{index + 1}</td>
                        <td>{user.name || "-"}</td>
                        <td>{row.amount}</td>
                        <td>{row.payout}</td>
                        <td>{row.upiId}</td>
                        <td>{row.status}</td>
                        <td>{row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-IN") : "-"}</td>
                        {!reportOnly && (
                          <td>
                            {row.status === "pending" && (
                              <div className="action-buttons">
                                <button
                                  className="approve-btn"
                                  disabled={actionLoading === row._id + "approved"}
                                  onClick={() => updateStatus(row._id, "approved")}
                                >
                                  Approve
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
                        )}
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
