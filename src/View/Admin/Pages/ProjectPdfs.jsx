import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ADMIN, API_BASE, getApiOrigin } from "../../../config/api";
import { clearAdminSession, getAdminToken } from "../../../utils/adminAuth";

function fileHref(fileUrl) {
  if (!fileUrl) return "";
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  const origin = getApiOrigin(API_BASE);
  return `${origin}${fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`}`;
}

function fileSize(bytes) {
  const size = Number(bytes || 0);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProjectPdfs() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const token = getAdminToken();
    if (!token) {
      navigate("/admin/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_ADMIN}/project-pdfs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }
      const data = await res.json();
      setRows(Array.isArray(data.data) ? data.data : []);
    } catch {
      setRows([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const token = getAdminToken();
    if (!token) {
      navigate("/admin/login");
      return;
    }
    if (!title.trim() || !file) {
      setError("Enter a title and choose a PDF");
      return;
    }

    const body = new FormData();
    body.append("title", title.trim());
    body.append("file", file);
    setSaving(true);
    try {
      const res = await fetch(`${API_ADMIN}/project-pdfs`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (res.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not upload PDF");
      setTitle("");
      setFile(null);
      event.target.reset();
      setMessage(data.message || "PDF uploaded");
      await load();
    } catch (err) {
      setError(err.message || "Could not upload PDF");
    }
    setSaving(false);
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete "${row.title}"?`)) return;
    const token = getAdminToken();
    if (!token) {
      navigate("/admin/login");
      return;
    }
    try {
      const res = await fetch(`${API_ADMIN}/project-pdfs/${row._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not delete PDF");
      setRows((prev) => prev.filter((item) => item._id !== row._id));
    } catch (err) {
      setError(err.message || "Could not delete PDF");
    }
  };

  return (
    <div className="admin-users-page">
      <div className="users-header-card">
        <div className="header-left">
          <div className="header-icon">
            <i className="bi bi-file-earmark-pdf-fill"></i>
          </div>
          <div>
            <h2>Project PDF</h2>
            <p>Upload PDFs for users to download</p>
          </div>
        </div>
      </div>

      <div className="users-table-card">
        <form className="payment-form" onSubmit={upload}>
          <div className="form-group">
            <label>Title</label>
            <input
              className="wallet-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project document name"
              required
            />
          </div>
          <div className="form-group">
            <label>PDF file</label>
            <input
              className="wallet-input"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>
          {error ? <div className="wallet-error">{error}</div> : null}
          {message ? <p>{message}</p> : null}
          <div className="wallet-modal-actions">
            <button type="submit" className="wallet-submit-btn" disabled={saving}>
              {saving ? "Uploading..." : "Upload PDF"}
            </button>
          </div>
        </form>

        {loading ? (
          <div className="empty-state">Loading PDFs...</div>
        ) : (
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>File</th>
                  <th>Size</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan="6">No PDFs uploaded</td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={row._id}>
                      <td>{index + 1}</td>
                      <td>{row.title}</td>
                      <td>{row.originalName || "PDF"}</td>
                      <td>{fileSize(row.size)}</td>
                      <td>
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleDateString("en-IN")
                          : "-"}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <a
                            className="approve-btn"
                            href={fileHref(row.fileUrl)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                          </a>
                          <button
                            type="button"
                            className="decline-btn"
                            onClick={() => remove(row)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
