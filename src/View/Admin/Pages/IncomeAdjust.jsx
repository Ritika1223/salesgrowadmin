import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ADMIN } from "../../../config/api";
import { clearAdminSession, getAdminToken } from "../../../utils/adminAuth";

function money(value) {
  return `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function IncomeAdjust({ mode = "credit" }) {
  const navigate = useNavigate();
  const isCredit = mode === "credit";
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);
    const token = getAdminToken();
    if (!token) {
      navigate("/admin/login");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_ADMIN}/income-adjust`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: userId.trim(),
          amount: Number(amount),
          direction: isCredit ? "credit" : "debit",
        }),
      });
      if (res.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not update income");
      setResult(data);
      setAmount("");
    } catch (err) {
      setError(err.message || "Could not update income");
    }
    setSaving(false);
  };

  return (
    <div className="admin-users-page">
      <div className="users-header-card">
        <div className="header-left">
          <div className="header-icon">
            <i className={isCredit ? "bi bi-plus-circle-fill" : "bi bi-dash-circle-fill"}></i>
          </div>
          <div>
            <h2>{isCredit ? "User Credit" : "User Debit"}</h2>
            <p>
              {isCredit
                ? "Add an amount to this user ID income"
                : "Deduct an amount from this user ID income"}
            </p>
          </div>
        </div>
      </div>

      <div className="users-table-card">
        <form className="payment-form" onSubmit={submit}>
          <div className="form-group">
            <label>User ID</label>
            <input
              className="wallet-input"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="KKW123456"
              required
            />
          </div>
          <div className="form-group">
            <label>Amount (USDT)</label>
            <input
              className="wallet-input"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
            />
          </div>
          {error ? <div className="wallet-error">{error}</div> : null}
          {result ? <p>{result.message}</p> : null}
          <div className="wallet-modal-actions">
            <button type="submit" className="wallet-submit-btn" disabled={saving}>
              {saving ? "Saving..." : isCredit ? "Credit income" : "Debit income"}
            </button>
          </div>
        </form>

        {result?.user ? (
          <div className="team-selected-user">
            <span>{result.user.name || "-"}</span>
            <strong>{result.user.referralCode || "-"}</strong>
            <span>Income {money(result.user.totalEarning)}</span>
            <span>Remaining {money(result.user.remaining)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
