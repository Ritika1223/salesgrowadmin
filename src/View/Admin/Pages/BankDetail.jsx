import React, { useEffect, useState } from "react";
import axios from "axios";

import { API_ADMIN, API_BASE, getApiOrigin } from "../../../config/api";
import { getAdminToken } from "../../../utils/adminAuth";

// Replicate Stickers.jsx authHeaders and image path resolution
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

const initialFormState = {
  upi: "",
  qrCode: null,
};

const BankDetailPage = () => {
  const [bankDetails, setBankDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [refreshFlag, setRefreshFlag] = useState(0);

  useEffect(() => {
    fetchBankDetails();
    // eslint-disable-next-line
  }, [refreshFlag]);

  // GET all bank/payment details
  const fetchBankDetails = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_ADMIN}/bank`, {
        headers: authHeaders(),
      });
      // FIX: Accept both { data: [...] } and [...] for safety
      const bd = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      setBankDetails(bd);
    } catch (err) {
      setBankDetails([]);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "qrCode") {
      setForm((prev) => ({ ...prev, qrCode: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // POST / (add bank detail, must use field name 'qrCode' for upload.single('qrCode'))
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    let errors = {};
    if (!form.upi) errors.upi = "Required";
    if (!form.qrCode) errors.qrCode = "Required";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const formData = new FormData();
    formData.append("upi", form.upi);
    formData.append("qrCode", form.qrCode);

    try {
      await axios.post(`${API_ADMIN}/bank`, formData, {
        headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
      });
      setShowForm(false);
      setForm(initialFormState);
      setRefreshFlag((f) => f + 1);
    } catch (err) {
      setFormErrors({ general: err?.response?.data?.message || "Error occurred" });
    }
  };

  // PATCH /:id/status (set a bank detail as active/inactive)
  const handleStatusToggle = async (id, isActive) => {
    try {
      await axios.patch(
        `${API_ADMIN}/${id}/status`,
        { isActive: !isActive },
        { headers: authHeaders() }
      );
      setRefreshFlag((f) => f + 1);
    } catch (err) {
      // handle error
    }
  };

  // DELETE /:id (delete bank/payment detail by id)
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure to delete this bank detail?")) return;
    try {
      await axios.delete(`${API_ADMIN}/${id}`, {
        headers: authHeaders(),
      });
      setRefreshFlag((f) => f + 1);
    } catch (err) {
      // handle error
    }
  };


  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  const [currentPage, setCurrentPage] = useState(1);

  const rowsPerPage = 10;

  const filteredBankDetails = bankDetails
    .filter((item) =>
      (item.upi || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {

        case "latest":
          return new Date(b.createdAt) - new Date(a.createdAt);

        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);

        case "active":
          return b.isActive - a.isActive;

        case "inactive":
          return a.isActive - b.isActive;

        case "upi":
          return a.upi.localeCompare(b.upi);

        default:
          return 0;
      }
    });

  const indexOfLast = currentPage * rowsPerPage;

  const indexOfFirst = indexOfLast - rowsPerPage;

  const currentBankDetails = filteredBankDetails.slice(
    indexOfFirst,
    indexOfLast
  );

  const totalPages = Math.ceil(
    filteredBankDetails.length / rowsPerPage
  );


  return (
    <div className="admin-users-page">

      {/* Header */}
      <div className="users-header-card">

        <div className="header-left">

          <div className="header-icon">
            <i className="bi bi-bank2"></i>
          </div>

          <div>
            <h2>Bank Details</h2>
            <p>Manage all UPI payment methods</p>
          </div>

        </div>

        <button
          className="dashboard-btn"
          onClick={() => setShowForm(true)}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Add Bank
        </button>

      </div>

      {/* Table Card */}
      <div className="users-table-card">

        <div className="table-top-bar">

          <div className="search-wrapper">

            <i className="bi bi-search"></i>

            <input
              type="text"
              className="search-input"
              placeholder="Search UPI..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />

          </div>

          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
          >

            <option value="latest">Latest</option>

            <option value="oldest">Oldest</option>

            <option value="upi">UPI A-Z</option>

            <option value="active">Active First</option>

            <option value="inactive">Inactive First</option>

          </select>

        </div>

        {loading ? (

          <div className="empty-state">

            <div className="spinner-border text-light mb-3"></div>

            <h5>Loading Bank Details...</h5>

          </div>

        ) : (

          <div className="table-responsive">

            <table className="premium-table">

              <thead>

                <tr>
                  <th>#</th>
                  <th>UPI ID</th>
                  <th>QR Code</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>

              </thead>

              <tbody>

                {bankDetails.length === 0 ? (

                  <tr>

                    <td colSpan="5">

                      <div className="empty-table">

                        <i className="bi bi-bank2"></i>

                        <p>No Bank Details Found</p>

                      </div>

                    </td>

                  </tr>

                ) : (

                  bankDetails
                    .filter((item) =>
                      item.upi
                        .toLowerCase()
                        .includes(search.toLowerCase())
                    )
                    .map((b, index) => (

                      <tr key={b._id}>

                        <td>{index + 1}</td>

                        <td>

                          <div className="user-info">

                            <div>

                              <div className="user-name">
                                {b.upi}
                              </div>

                              <div className="user-email">
                                Payment UPI
                              </div>

                            </div>

                          </div>

                        </td>

                        <td>
                          {b.qrCode ? (
                            <img
                              src={absImage(b.qrCode)}
                              alt="QR"
                              className="bank-qr"
                            />
                          ) : (
                            <span className="text-muted">No QR</span>
                          )}
                        </td>

                        <td>
                          <span
                            className={`status-badge ${b.isActive ? "active" : "blocked"
                              }`}
                          >
                            {b.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <div className="action-buttons">

                            <button
                              className={b.isActive ? "edit-btn" : "view-btn"}
                              onClick={() =>
                                handleStatusToggle(b._id, b.isActive)
                              }
                              title={b.isActive ? "Deactivate" : "Activate"}
                            >
                              <i
                                className={`bi ${b.isActive
                                    ? "bi-toggle-on"
                                    : "bi-toggle-off"
                                  }`}
                              ></i>
                            </button>

                            <button
                              className="delete-btn"
                              onClick={() => handleDelete(b._id)}
                              title="Delete"
                            >
                              <i className="bi bi-trash-fill"></i>
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

        {
          totalPages > 1 && (

            <div className="custom-pagination">

              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <i className="bi bi-chevron-left"></i>
              </button>

              {[...Array(totalPages)].map((_, index) => (

                <button
                  key={index}
                  className={currentPage === index + 1 ? "active-page" : ""}
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </button>

              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                <i className="bi bi-chevron-right"></i>
              </button>

            </div>

          )}

      </div>

      {/* Modal */}
      {showForm && (

        <div className="admin-modal-overlay">

          <div className="admin-modal">

            <div className="admin-modal-header">

              <div>

                <h3>Add Bank Detail</h3>

                <p>Add new UPI payment method</p>

              </div>

              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowForm(false);
                  setForm(initialFormState);
                  setFormErrors({});
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>

            </div>

            <form
              className="admin-form"
              onSubmit={handleSubmit}
              encType="multipart/form-data"
            >

              <div className="form-group">

                <label>
                  <i className="bi bi-credit-card-2-front me-2"></i>
                  UPI ID
                </label>

                <input
                  type="text"
                  name="upi"
                  value={form.upi}
                  onChange={handleChange}
                  placeholder="example@upi"
                />

                {formErrors.upi && (
                  <small className="text-danger">
                    {formErrors.upi}
                  </small>
                )}

              </div>

              <div className="form-group">

                <label>
                  <i className="bi bi-qr-code me-2"></i>
                  QR Code
                </label>

                <input
                  type="file"
                  name="qrCode"
                  accept="image/*"
                  onChange={handleChange}
                />

                {formErrors.qrCode && (
                  <small className="text-danger">
                    {formErrors.qrCode}
                  </small>
                )}

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowForm(false);
                    setForm(initialFormState);
                    setFormErrors({});
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-btn"
                >
                  <i className="bi bi-check-circle me-2"></i>

                  Save

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default BankDetailPage;