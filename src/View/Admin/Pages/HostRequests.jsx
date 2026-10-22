import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_ADMIN, API_BASE, getApiOrigin } from "../../../config/api";
import { getAdminToken } from "../../../utils/adminAuth";

function authHeaders() {
  const t = getAdminToken();
  return {
    "Content-Type": "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}

const apiOrigin = getApiOrigin ? getApiOrigin(API_BASE) : "";
function absImage(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${apiOrigin}${url.startsWith("/") ? url : "/" + url}`;
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

export default function HostRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line
  }, [refreshFlag]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_ADMIN}/host-requests`, {
        headers: authHeaders(),
      });
      setRequests(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setRequests([]);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (id, status) => {
    const verb = status === "approved" ? "verify and make this user a host" : "reject";
    if (!window.confirm(`Are you sure you want to ${verb}? An email will be sent to the user.`)) {
      return;
    }
    setActionLoading(id + status);
    try {
      await axios.patch(
        `${API_ADMIN}/host-requests/${id}/status`,
        { status },
        { headers: authHeaders() }
      );
      setRefreshFlag((f) => f + 1);
    } catch (err) {
      alert(err?.response?.data?.message || "Action failed");
    }
    setActionLoading(null);
  };

  const filtered = requests
    .filter((item) => {
      const user = item.userId || {};
      const keyword = search.toLowerCase();
      return (
        (item.name || "").toLowerCase().includes(keyword) ||
        (item.email || "").toLowerCase().includes(keyword) ||
        (user.name || "").toLowerCase().includes(keyword) ||
        (user.email || "").toLowerCase().includes(keyword) ||
        (item.transactionId || "").toLowerCase().includes(keyword) ||
        (item.upiId || "").toLowerCase().includes(keyword)
      );
    })
    .filter((item) => (statusFilter === "all" ? true : item.status === statusFilter));

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filtered.slice(indexOfFirst, indexOfLast);

  return (
    <div className="admin-users-page">
      <div className="users-header-card">
        <div className="header-left">
          <div className="header-icon">
            <i className="bi bi-broadcast"></i>
          </div>
          <div>
            <h2>Host Requests</h2>
            <p>Verify payments and approve users as hosts</p>
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
            placeholder="Search name / email / UTR / UPI..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <select
          className="sort-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="users-table-card">
        {loading ? (
          <div className="empty-state">
            <i className="bi bi-arrow-repeat"></i>
            <h5>Loading requests...</h5>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Applicant</th>
                  <th>Amount</th>
                  <th>Txn / UPI</th>
                  <th>Screenshot</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <div className="empty-state">
                        <i className="bi bi-inbox"></i>
                        <h5>No host requests</h5>
                        <p>New become-host submissions will appear here.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentRows.map((r, index) => {
                    const user = r.userId || {};
                    return (
                      <tr key={r._id}>
                        <td>{indexOfFirst + index + 1}</td>
                        <td>
                          <div className="user-info">
                            <div>
                              <h6>{r.name || user.name || "Unknown"}</h6>
                              <span>{r.email || user.email || "-"}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="amount-badge">
                            ₹ {Number(r.amount).toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <span className="trx-id">{r.transactionId || "-"}</span>
                          {r.upiId ? (
                            <div>
                              <small>{r.upiId}</small>
                            </div>
                          ) : null}
                        </td>
                        <td>
                          {r.attachment ? (
                            <a href={absImage(r.attachment)} target="_blank" rel="noreferrer">
                              <img
                                src={absImage(r.attachment)}
                                alt=""
                                className="payment-preview"
                              />
                            </a>
                          ) : (
                            <span className="text-muted">No Image</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${statusClass(r.status)}`}>
                            {r.status}
                          </span>
                        </td>
                        <td>
                          <div className="date-cell">
                            {new Date(r.createdAt).toLocaleDateString()}
                            <small>{new Date(r.createdAt).toLocaleTimeString()}</small>
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {r.status === "pending" && (
                              <>
                                <button
                                  className="approve-btn"
                                  title="Verify & make host"
                                  disabled={actionLoading === r._id + "approved"}
                                  onClick={() => handleStatusUpdate(r._id, "approved")}
                                >
                                  <i className="bi bi-check-lg"></i>
                                </button>
                                <button
                                  className="decline-btn"
                                  title="Reject"
                                  disabled={actionLoading === r._id + "rejected"}
                                  onClick={() => handleStatusUpdate(r._id, "rejected")}
                                >
                                  <i className="bi bi-x-lg"></i>
                                </button>
                              </>
                            )}
                          </div>
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
