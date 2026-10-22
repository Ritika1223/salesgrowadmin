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

export default function AddFundPage() {
  const [payments, setPayments] = useState([]);
  const [coinsPerRupee, setCoinsPerRupee] = useState(10);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    fetchApprovedPayments();
    // eslint-disable-next-line
  }, [refreshFlag]);

  const fetchApprovedPayments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_ADMIN}/payment-history/approved`, {
        headers: authHeaders(),
      });
      setPayments(Array.isArray(res.data?.data) ? res.data.data : []);
      if (res.data?.coinsPerRupee) {
        setCoinsPerRupee(res.data.coinsPerRupee);
      }
    } catch {
      setPayments([]);
    }
    setLoading(false);
  };

  const handleAddFund = async (paymentId) => {
    if (!window.confirm("Add coins to this user's wallet based on the payment amount?")) return;
    setActionLoading(paymentId);
    try {
      const res = await axios.post(
        `${API_ADMIN}/payment-history/${paymentId}/add-fund`,
        {},
        { headers: authHeaders() }
      );
      alert(
        `Success! ${res.data?.data?.coinsAdded || 0} coins added. New balance: ${res.data?.data?.walletBalance || 0}`
      );
      setRefreshFlag((f) => f + 1);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to add fund");
    }
    setActionLoading(null);
  };

  const filteredPayments = selectedUserId
    ? payments.filter((p) => {
        const uid = typeof p.userId === "object" ? p.userId?._id : p.userId;
        return String(uid) === String(selectedUserId);
      })
    : payments;

  const uniqueUsers = [];
  const seen = new Set();
  payments.forEach((p) => {
    const user = p.userId;
    if (typeof user === "object" && user?._id && !seen.has(String(user._id))) {
      seen.add(String(user._id));
      uniqueUsers.push(user);
    }
  });

  const [search, setSearch] = useState("");
const [currentPage, setCurrentPage] = useState(1);

const itemsPerPage = 10;

const searchedPayments = filteredPayments.filter((p) => {
  const user = typeof p.userId === "object" && p.userId ? p.userId : {};
  const keyword = search.toLowerCase();

  return (
    (user?.name || p.userName || "").toLowerCase().includes(keyword) ||
    (user?.email || p.userEmail || "").toLowerCase().includes(keyword) ||
    (user?.phone || p.userPhone || "").toLowerCase().includes(keyword) ||
    (p.transactionNo || "").toLowerCase().includes(keyword)
  );
});

const indexOfLast = currentPage * itemsPerPage;
const indexOfFirst = indexOfLast - itemsPerPage;

const currentPayments = searchedPayments.slice(indexOfFirst, indexOfLast);

const totalPages = Math.ceil(searchedPayments.length / itemsPerPage);

const getPageNumbers = () => {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }
  return pages;
};

  return (
  <div className="admin-users-page">

  {/* Header */}
  <div className="users-header-card">

    <div className="header-left">

      <div className="header-icon">
        <i className="bi bi-wallet2"></i>
      </div>

      <div>
        <h2>Add Fund Management</h2>
        <p>Credit wallet coins for approved payments</p>
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

  {/* Search & Filter */}

  <div className="table-top-bar">

    <div className="search-wrapper">

      <i className="bi bi-search"></i>

      <input
        type="text"
        className="search-input"
        placeholder="Search User / Transaction..."
        value={search}
        onChange={(e)=>{
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
      />

    </div>

    <select
      className="sort-select"
      value={selectedUserId}
      onChange={(e)=>{
        setSelectedUserId(e.target.value);
        setCurrentPage(1);
      }}
    >
      <option value="">All Users</option>

      {uniqueUsers.map((u)=>(
        <option
          key={u._id}
          value={u._id}
        >
          {u.name}
        </option>
      ))}

    </select>

  </div>

  {/* Table */}

  <div className="users-table-card">

    {loading ? (

      <div className="empty-state">
        Loading Payments...
      </div>

    ) : (

      <div className="table-responsive">

        <table className="premium-table">

          <thead>

            <tr>

              <th>#</th>

              <th>User</th>

              <th>Amount</th>

              <th>Coins</th>

              <th>Transaction</th>

              <th>Screenshot</th>

              <th>Wallet</th>

              <th>Date</th>

              <th>Action</th>

            </tr>

          </thead>

          <tbody>

            {currentPayments.length===0 ? (

              <tr>

                <td
                  colSpan="9"
                  className="empty-state"
                >
                  No Approved Payments Found
                </td>

              </tr>

            ) : (

              currentPayments.map((p,index)=>{

                const user =
                  (typeof p.userId === "object" && p.userId) || {};
                const userName = user.name || p.userName || "Deleted user";
                const userEmail = user.email || p.userEmail || "";
                const userPhone = user.phone || p.userPhone || "";

                const coins =
                  Number(p.coins) || Math.round(Number(p.amount)*coinsPerRupee);

                return(

                  <tr key={p._id}>

                    <td>
                      {indexOfFirst + index +1}
                    </td>

                    <td>

                      <div className="user-cell">

                        <div className="user-avatar">

                          <i className="bi bi-person-circle"></i>

                        </div>

                        <div>

                          <div className="user-name">
                            {userName}
                          </div>

                          <div className="user-email">
                            {userEmail || userPhone || "-"}
                          </div>

                        </div>

                      </div>

                    </td>

                    <td>

                      <span className="amount-badge">

                        ₹{Number(p.amount).toLocaleString()}

                      </span>

                    </td>

                    <td>

                      <span className="coin-badge">

                        {coins.toLocaleString()} Coins

                      </span>

                    </td>

                    <td>

                      {p.transactionNo}

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
                            className="payment-proof"
                          />

                        </a>

                      ) : "-"}

                    </td>

                    <td>

                      <span className="wallet-badge">

                        {Number(user.walletBalance||0).toLocaleString()}

                      </span>

                    </td>

                    <td>

                      {new Date(p.createdAt).toLocaleDateString()}

                    </td>

                    <td>

                      <button

                        className="fund-btn"

                        disabled={actionLoading===p._id}

                        onClick={()=>handleAddFund(p._id)}

                      >

                        <i className="bi bi-wallet2 me-2"></i>

                        {actionLoading===p._id
                          ? "Adding..."
                          : "Add Fund"}

                      </button>

                    </td>

                  </tr>

                )

              })

            )}

          </tbody>

        </table>

      </div>

    )}

  </div>

  {/* Pagination */}

  {totalPages>1 && (

    <div className="custom-pagination">

      <button
        disabled={currentPage===1}
        onClick={()=>setCurrentPage(prev=>prev-1)}
      >
        <i className="bi bi-chevron-left"></i>
      </button>

      {getPageNumbers().map((page)=>(
        <button
          key={page}
          className={currentPage===page ? "active-page":""}
          onClick={()=>setCurrentPage(page)}
        >
          {page}
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
