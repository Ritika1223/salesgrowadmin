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

function statusClass(status) {
  switch (status) {
    case "pending":
      return "pending";
    case "approved":
      return "approved";
    case "rejected":
      return "declined";
    default:
      return "";
  }
}

export default function AdminFundRequests({ reportOnly = false }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_ADMIN}/plan-requests`, {
          headers: authHeaders(),
        });
        setRequests(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch {
        setRequests([]);
      }
      setLoading(false);
    };
    load();
  }, [refreshFlag]);

  const handleStatusUpdate = async (id, status) => {
    const verb = status === "approved" ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${verb} this fund request?`)) {
      return;
    }
    setActionLoading(id + status);
    try {
      await axios.patch(
        `${API_ADMIN}/plan-requests/${id}/status`,
        { status },
        { headers: authHeaders() }
      );
      setRefreshFlag((f) => f + 1);
    } catch (err) {
      alert(err?.response?.data?.message || "Action failed");
    }
    setActionLoading(null);
  };

  const filtered = requests.filter((item) => {
    const user = item.userId || {};
    const keyword = search.toLowerCase();
    return (
      (item.name || "").toLowerCase().includes(keyword) ||
      (item.email || "").toLowerCase().includes(keyword) ||
      (user.name || "").toLowerCase().includes(keyword) ||
      (item.transactionId || "").toLowerCase().includes(keyword) ||
      (item.remark || "").toLowerCase().includes(keyword) ||
      String(item.amount || "").includes(keyword)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filtered.slice(indexOfFirst, indexOfLast);
  const colSpan = reportOnly ? 7 : 8;

  return (
    <div className="admin-users-page">
      <div className="users-header-card">
        <div className="header-left">
          <div className="header-icon">
            <i className={`bi ${reportOnly ? "bi-file-earmark-text" : "bi-cash-coin"}`}></i>
          </div>
          <div>
            <h2>{reportOnly ? "Fund Request Report" : "Fund Requests"}</h2>
            <p>
              {reportOnly
                ? "All fund transfer requests"
                : "Approve or reject fund transfer requests"}
            </p>
          </div>
        </div>
        <button className="dashboard-btn" onClick={() => setRefreshFlag((f) => f + 1)}>
          <i className="bi bi-arrow-repeat me-2"></i>
          Refresh
        </button>
      </div>

      <div className="table-top-bar">
        <div className="search-wrapper">
          <i className="bi bi-search"></i>
          <input
            className="search-input"
            placeholder="Search name, transaction id, remark, amount..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <div className="users-table-card">
        {loading ? (
          <div className="empty-state">
            <h5>Loading requests...</h5>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Transaction ID</th>
                  <th>Remark</th>
                  <th>Status</th>
                  <th>Date</th>
                  {!reportOnly && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {currentRows.length === 0 ? (
                  <tr>
                    <td colSpan={colSpan}>
                      <div className="empty-state">
                        <h5>No fund requests</h5>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentRows.map((r, index) => {
                    const user = r.userId || {};
                    return (
                      <tr key={r._id}>
                        <td>{indexOfFirst + index + 1}</td>
                        <td>{r.name || user.name || "-"}</td>
                        <td>$ {Number(r.amount || 0).toLocaleString()}</td>
                        <td>{r.transactionId || "-"}</td>
                        <td>{r.remark || "-"}</td>
                        <td>
                          <span className={`status-badge ${statusClass(r.status)}`}>
                            {r.status}
                          </span>
                        </td>
                        <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "-"}</td>
                        {!reportOnly && (
                          <td>
                            <div className="action-buttons">
                              {r.status === "pending" && (
                                <>
                                  <button
                                    className="approve-btn"
                                    title="Approve"
                                    aria-label="Approve"
                                    disabled={actionLoading === r._id + "approved"}
                                    onClick={() => handleStatusUpdate(r._id, "approved")}
                                  >
                                    <i className="bi bi-check-lg"></i>
                                    <span className="action-label">Approve</span>
                                  </button>
                                  <button
                                    className="decline-btn"
                                    title="Reject"
                                    aria-label="Reject"
                                    disabled={actionLoading === r._id + "rejected"}
                                    onClick={() => handleStatusUpdate(r._id, "rejected")}
                                  >
                                    <i className="bi bi-x-lg"></i>
                                    <span className="action-label">Reject</span>
                                  </button>
                                </>
                              )}
                            </div>
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

      {totalPages > 1 && (
        <div className="d-flex justify-content-end gap-2 mt-3">
          <button
            className="dashboard-btn"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Prev
          </button>
          <button
            className="dashboard-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
