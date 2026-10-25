import React, { useEffect, useMemo, useState } from "react";
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

function roiShare(level) {
  const n = Number(level);
  if (n === 1) return "20%";
  if (n === 2) return "10%";
  if (n === 3 || n === 4) return "5%";
  if (n >= 5 && n <= 11) return "3%";
  if (n >= 12 && n <= 21) return "2%";
  return "—";
}

function personLabel(user) {
  if (!user) return "—";
  return user.name || user.nickname || user.referralCode || "—";
}

export default function AdminRoiToRoiIncome() {
  const [rows, setRows] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_ADMIN}/income/roi-to-roi`, { headers: authHeaders() });
        if (!cancelled) {
          setRows(Array.isArray(res.data?.data) ? res.data.data : []);
          setTotalAmount(Number(res.data?.amount || 0));
        }
      } catch {
        if (!cancelled) {
          setRows([]);
          setTotalAmount(0);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((row) => {
      const receiver = row.userId || {};
      const from = row.fromUserId || {};
      const haystack = [
        receiver.name,
        receiver.nickname,
        receiver.referralCode,
        from.name,
        from.nickname,
        from.referralCode,
        row.level,
        row.amount,
      ]
        .filter((value) => value != null)
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [rows, search]);

  return (
    <div className="admin-users-page">
      <div className="users-header-card">
        <div className="header-left">
          <div className="header-icon">
            <i className="bi bi-arrow-repeat"></i>
          </div>
          <div>
            <h2>ROI to ROI Income</h2>
            <p>Level 1 20%, Level 2 10%, Level 3–4 5%, Level 5–11 3%, Level 12–21 2% of downline daily ROI</p>
          </div>
        </div>
      </div>
      <div className="users-table-card">
        <div className="income-history-table-topbar" style={{ marginBottom: 16 }}>
          <div className="income-history-search-box">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search by name, ID, level, amount..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <strong>Total ${Number(totalAmount).toLocaleString("en-IN")}</strong>
        </div>
        {loading ? (
          <div className="empty-state"><h5>Loading...</h5></div>
        ) : (
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>User</th>
                  <th>User ID</th>
                  <th>From</th>
                  <th>From ID</th>
                  <th>Level</th>
                  <th>Share</th>
                  <th>Amount ($)</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9}>No ROI to ROI income yet</td>
                  </tr>
                ) : (
                  filtered.map((row, index) => {
                    const receiver = row.userId || {};
                    const from = row.fromUserId || {};
                    return (
                      <tr key={row._id}>
                        <td>{index + 1}</td>
                        <td>{personLabel(receiver)}</td>
                        <td>{receiver.referralCode || "—"}</td>
                        <td>{personLabel(from)}</td>
                        <td>{from.referralCode || "—"}</td>
                        <td>{row.level || "—"}</td>
                        <td>{roiShare(row.level)}</td>
                        <td>{row.amount}</td>
                        <td>{row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-IN") : "—"}</td>
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
