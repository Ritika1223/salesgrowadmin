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

function statusBadge(status) {
  switch (status) {
    case "approved":
      return "bg-success";
    case "declined":
      return "bg-danger";
    case "completed":
      return "bg-primary";
    default:
      return "bg-warning text-dark";
  }
}

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(0);

  const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("all");
const [sortBy, setSortBy] = useState("latest");

const [currentPage, setCurrentPage] = useState(1);

const rowsPerPage = 10;

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line
  }, [refreshFlag]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_ADMIN}/payment-history`, {
        headers: authHeaders(),
      });
      setPayments(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setPayments([]);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this payment?`)) return;
    setActionLoading(id + status);
    try {
      await axios.patch(
        `${API_ADMIN}/payment-history/${id}/status`,
        { status },
        { headers: authHeaders() }
      );
      setRefreshFlag((f) => f + 1);
    } catch (err) {
      alert(err?.response?.data?.message || "Action failed");
    }
    setActionLoading(null);
  };

  const filteredPayments = payments
  .filter((item) => {

    const user = (typeof item.userId === "object" && item.userId) || {};

    const keyword = search.toLowerCase();

    return (

      (user.name || item.userName || "").toLowerCase().includes(keyword) ||

      (user.email || item.userEmail || "").toLowerCase().includes(keyword) ||

      (user.phone || item.userPhone || "").toLowerCase().includes(keyword) ||

      (item.transactionNo || "").toLowerCase().includes(keyword)

    );

  })

  .filter((item) =>

    statusFilter === "all"

      ? true

      : item.status === statusFilter

  )

  .sort((a, b) => {

    switch (sortBy) {

      case "latest":

        return new Date(b.createdAt) - new Date(a.createdAt);

      case "oldest":

        return new Date(a.createdAt) - new Date(b.createdAt);

      case "high":

        return b.amount - a.amount;

      case "low":

        return a.amount - b.amount;

      default:

        return 0;

    }

  });

  const indexOfLast = currentPage * rowsPerPage;

const indexOfFirst = indexOfLast - rowsPerPage;

const currentPayments = filteredPayments.slice(

  indexOfFirst,

  indexOfLast

);

const totalPages = Math.ceil(

  filteredPayments.length / rowsPerPage

);

function statusClass(status) {
  switch (status) {
    case "pending":
      return "pending";

    case "approved":
      return "approved";

    case "completed":
      return "completed";

    case "declined":
      return "declined";

    default:
      return "";
  }
}

  return (
    
 <div className="admin-users-page">

<div className="users-header-card">

    <div className="header-left">

        <div className="header-icon">
            <i className="bi bi-credit-card-2-front-fill"></i>
        </div>

        <div>
            <h2>Payment History</h2>
            <p>Manage all payment requests</p>
        </div>

    </div>

    <button
        className="dashboard-btn"
        onClick={() => setRefreshFlag(f => f + 1)}
    >
        <i className="bi bi-arrow-repeat me-2"></i>

        Refresh

    </button>

</div>

<div className="table-top-bar">

    <div className="search-wrapper">

        <i className="bi bi-search"></i>

        <input
            className="search-input"
            placeholder="Search User / Transaction..."
            value={search}
            onChange={(e)=>{

                setSearch(e.target.value);

                setCurrentPage(1);

            }}
        />

    </div>

    <div className="d-flex gap-3">

        <select
            className="sort-select"
            value={statusFilter}
            onChange={(e)=>{

                setStatusFilter(e.target.value);

                setCurrentPage(1);

            }}
        >

            <option value="all">All Status</option>

            <option value="pending">Pending</option>

            <option value="approved">Approved</option>

            <option value="completed">Completed</option>

            <option value="declined">Declined</option>

        </select>

        <select
            className="sort-select"
            value={sortBy}
            onChange={(e)=>setSortBy(e.target.value)}
        >

            <option value="latest">Latest</option>

            <option value="oldest">Oldest</option>

            <option value="high">Highest Amount</option>

            <option value="low">Lowest Amount</option>

        </select>

    </div>

</div>


<div className="users-table-card">

  {loading ? (

    <div className="empty-state">
      <i className="bi bi-arrow-repeat"></i>
      <h5>Loading Payments...</h5>
    </div>

  ) : (

    <div className="table-responsive">

      <table className="premium-table">

        <thead>
          <tr>
            <th>#</th>
            <th>User</th>
            <th>Amount</th>
            <th>Transaction ID</th>
            <th>Screenshot</th>
            <th>Status</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {currentPayments.length === 0 ? (

            <tr>
              <td colSpan="8">
                <div className="empty-state">
                  <i className="bi bi-wallet2"></i>
                  <h5>No Payment Found</h5>
                  <p>No payment request available.</p>
                </div>
              </td>
            </tr>

          ) : (

            currentPayments.map((p, index) => {

              const user = (typeof p.userId === "object" && p.userId) || {};
              const userName = user.name || p.userName || "Unknown";
              const userContact = user.email || p.userEmail || user.phone || p.userPhone || "-";

              return (

                <tr key={p._id}>

                  <td>
                    {indexOfFirst + index + 1}
                  </td>

                  <td>

                    <div className="user-info">
                      <div>

                        <h6>
                          {userName}
                        </h6>

                        <span>
                          {userContact}
                        </span>

                      </div>

                    </div>

                  </td>

                  <td>

                    <span className="amount-badge">

                      ₹ {Number(p.amount).toLocaleString()}

                    </span>

                  </td>

                  <td>

                    <span className="trx-id">

                      {p.transactionNo}

                    </span>

                  </td>

                  <td>

                    {p.screenshot ? (

                      <a
                        href={absImage(p.screenshot)}
                        target="_blank"
                        rel="noreferrer"
                      >

                        <img
                          src={absImage(p.screenshot)}
                          alt=""
                          className="payment-preview"
                        />

                      </a>

                    ) : (

                      <span className="text-muted">
                        No Image
                      </span>

                    )}

                  </td>

                  <td>

                    <span
                      className={`status-badge ${statusClass(
                        p.status
                      )}`}
                    >
                      {p.status}
                    </span>

                    {p.coinsAdded > 0 && (

                      <div className="coins-added">

                        +{p.coinsAdded} Coins

                      </div>

                    )}

                  </td>

                  <td>

                    <div className="date-cell">

                      {new Date(
                        p.createdAt
                      ).toLocaleDateString()}

                      <small>

                        {new Date(
                          p.createdAt
                        ).toLocaleTimeString()}

                      </small>

                    </div>

                  </td>

                  <td>

                    <div className="action-buttons">

                      {p.status === "pending" && (

                        <>

                          <button
                            className="approve-btn"
                            disabled={
                              actionLoading ===
                              p._id + "approved"
                            }
                            onClick={() =>
                              handleStatusUpdate(
                                p._id,
                                "approved"
                              )
                            }
                          >
                            <i className="bi bi-check-lg"></i>
                          </button>

                          <button
                            className="decline-btn"
                            disabled={
                              actionLoading ===
                              p._id + "declined"
                            }
                            onClick={() =>
                              handleStatusUpdate(
                                p._id,
                                "declined"
                              )
                            }
                          >
                            <i className="bi bi-x-lg"></i>
                          </button>

                        </>

                      )}

                      {p.status === "approved" && (

                        <span className="approved-text">

                          Ready

                        </span>

                      )}

                      {p.status === "completed" && (

                        <span className="completed-text">

                          Credited

                        </span>

                      )}

                      {p.status === "declined" && (

                        <button
                          className="approve-btn"
                          onClick={() =>
                            handleStatusUpdate(
                              p._id,
                              "approved"
                            )
                          }
                        >
                          <i className="bi bi-arrow-clockwise"></i>
                        </button>

                      )}

                    </div>

                  </td>

                </tr>

              );

            })

          )}

        </tbody>

      </table>

      {totalPages > 1 && (

        <div className="custom-pagination">

          <button
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage((prev) => prev - 1)
            }
          >
            <i className="bi bi-chevron-left"></i>
          </button>

          {[...Array(totalPages)].map((_, index) => (

            <button
              key={index}
              className={
                currentPage === index + 1
                  ? "active-page"
                  : ""
              }
              onClick={() =>
                setCurrentPage(index + 1)
              }
            >
              {index + 1}
            </button>

          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => prev + 1)
            }
          >
            <i className="bi bi-chevron-right"></i>
          </button>

        </div>

      )}

    </div>

  )}

</div>


{totalPages > 1 && (

<div className="custom-pagination">

<button

disabled={currentPage===1}

onClick={()=>setCurrentPage(prev=>prev-1)}

>

<i className="bi bi-chevron-left"></i>

</button>

{[...Array(totalPages)].map((_,index)=>(

<button

key={index}

className={currentPage===index+1 ? "active-page" : ""}

onClick={()=>setCurrentPage(index+1)}

>

{index+1}

</button>

))}

<button

disabled={currentPage===totalPages}

onClick={()=>setCurrentPage(prev=>prev+1)}

>

<i className="bi bi-chevron-right"></i>

</button>

</div>

)}



 </div>

  );
}
