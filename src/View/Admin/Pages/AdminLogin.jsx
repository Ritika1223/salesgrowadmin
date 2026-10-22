import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ADMIN } from "../../../config/api";
import { setAdminSession } from "../../../utils/adminAuth";

const loginUrl = `${API_ADMIN}/auth/login`;

export default function AdminLogin() {
const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    adminUsername: "",
    adminPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUsername: form.adminUsername,
          adminPassword: form.adminPassword
        })
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        setError("Unexpected response from server.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.message || "Admin login failed.");
      } else if (data.token) {
        setAdminSession(data.token, data.admin || null);
        setSuccess("Signed in.");
        navigate("/admin/dashboard", { replace: true });
      } else {
        setError("No token returned.");
      }
    } catch (err) {
      setError("Cannot reach API: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="admin-login-page">

  <div className="admin-login-card">

    {/* TOP LOGO */}
    <div className="admin-login-top">

      <div className="admin-login-icon">
        <i className="bi bi-shield-lock-fill"></i>
      </div>

      <h2>
        Admin Login
      </h2>

      <p>
        Secure admin access panel
      </p>

    </div>

    {/* FORM */}
    <form
      className="admin-login-form"
      onSubmit={handleSubmit}
    >

      {/* USERNAME */}
      <div className="admin-login-group">

        <label>
          Username
        </label>

        <div className="admin-login-input">

          <i className="bi bi-person-fill"></i>

          <input
            type="text"
            name="adminUsername"
            autoComplete="username"
            placeholder="Enter admin username"
            value={form.adminUsername}
            onChange={handleChange}
            required
          />

        </div>

      </div>

      {/* PASSWORD */}
<div className="admin-login-group">

  <label>
    Password
  </label>

  <div className="admin-login-input">

    <i className="bi bi-lock-fill"></i>

    <input
      type={showPassword ? "text" : "password"}
      name="adminPassword"
      autoComplete="current-password"
      placeholder="Enter admin password"
      value={form.adminPassword}
      onChange={handleChange}
      required
    />

    <button
      type="button"
      className="admin-password-toggle"
      onClick={() => setShowPassword(!showPassword)}
    >
      {
        showPassword ? (
          <i className="bi bi-eye-slash-fill"></i>
        ) : (
          <i className="bi bi-eye-fill"></i>
        )
      }
    </button>

  </div>

</div>

      {/* MESSAGE */}
      {error && (
        <div className="admin-login-msg error">
          {error}
        </div>
      )}

      {success && (
        <div className="admin-login-msg success">
          {success}
        </div>
      )}

      {/* BUTTON */}
      <button
        type="submit"
        className="admin-login-btn"
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm"></span>
            Signing In...
          </>
        ) : (
          <>
            <i className="bi bi-box-arrow-in-right"></i>
            Sign In
          </>
        )}
      </button>

    </form>

    {/* FOOTER */}
    <div className="admin-login-footer">

      <p>
        User login?
        <a href="/login">
          Login Here
        </a>
      </p>

    </div>

  </div>

</div>
  );
}
