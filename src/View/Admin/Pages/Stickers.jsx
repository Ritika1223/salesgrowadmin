import React, { useEffect, useState } from "react";
import { API_ADMIN, API_BASE, getApiOrigin } from "../../../config/api";
import { getAdminToken, clearAdminSession } from "../../../utils/adminAuth";
import { useNavigate } from "react-router-dom";

// Input styling class
const formInputClass = "admin-form-input";

function authHeaders() {
  const t = getAdminToken();
  return {
    "Content-Type": "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {})
  };
}

// Inline style injection for form input class
const injectInputStyles = () => {
  if (document.getElementById("admin-input-css")) return;
  const style = document.createElement("style");
  style.id = "admin-input-css";
  style.textContent = `
    .${formInputClass} {
      width: 100%;
      padding: 11px 11px;
      border: 1.5px solid #b7e1ea;
      border-radius: 7px;
      font-size: 15px;
      box-sizing: border-box;
      background: #fcfdfe;
      color: #000 !important;
    }
  `;
  document.head.appendChild(style);
};

export default function Stickers() {
  const navigate = useNavigate();
  const apiOrigin = getApiOrigin(API_BASE);

  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
const [currentPage, setCurrentPage] = useState(1);

const stickersPerPage = 10;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    imageUrl: "",
    cost: "",
    isCustom: true
  });

  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    injectInputStyles();
    loadStickers();

  }, []);

  // ==============================
  // LOAD STICKERS
  // ==============================
  const loadStickers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_ADMIN}/stickers`, {
        headers: authHeaders()
      });

      if (res.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }

      const data = await res.json();
      setStickers(data.stickers || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // ==============================
  // CREATE STICKER
  // ==============================
  const submitSticker = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("slug", form.slug);
      formData.append("cost", form.cost);
      formData.append("isCustom", form.isCustom);

      if (form.image) {
        formData.append("image", form.image);
      }

      const res = await fetch(`${API_ADMIN}/stickers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAdminToken()}`
        },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.message);
        return;
      }

      setMsg("✅ Sticker created");
      setShowForm(false);
      loadStickers();

    } catch (err) {
      setMsg("Upload failed");
    }

    setSaving(false);
  };

  // ==============================
  // DELETE STICKER
  // ==============================
  const deleteSticker = async (id) => {
    if (!window.confirm("Delete this sticker?")) return;

    try {
      const res = await fetch(`${API_ADMIN}/stickers/${id}`, {
        method: "DELETE",
        headers: authHeaders()
      });

      if (res.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }

      loadStickers();
    } catch (err) {
      console.error(err);
    }
  };

  // ==============================
  // IMAGE HELPER
  // ==============================
  const absImage = (url) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    return `${apiOrigin}${url.startsWith("/") ? url : "/" + url}`;
  };

  const filteredStickers = stickers.filter((sticker) =>
  `${sticker.name} ${sticker.slug} ${sticker.cost}`
    .toLowerCase()
    .includes(search.toLowerCase())
);

const totalPages = Math.ceil(
  filteredStickers.length / stickersPerPage
);

const indexOfLastSticker = currentPage * stickersPerPage;
const indexOfFirstSticker =
  indexOfLastSticker - stickersPerPage;

const currentStickers = filteredStickers.slice(
  indexOfFirstSticker,
  indexOfLastSticker
);

const getPageNumbers = () => {
  const pages = [];

  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, currentPage + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
};

  // ==============================
  // UI
  // ==============================
  return (
    
    <>

      <div className="admin-users-page">

     <div className="users-header-card">

    <div className="header-left">
        <div className="header-icon">
            <i className="bi bi-emoji-smile-fill"></i>
        </div>

        <div>
            <h2>Stickers Management</h2>
            <p>Manage all stickers and rewards</p>
        </div>
    </div>

    <button
        className="dashboard-btn"
        onClick={() => {
            setShowForm(true);
            setMsg("");
        }}
    >
        <i className="bi bi-plus-circle me-2"></i>
        Add Sticker
    </button>

</div>

     <div className="users-table-card">

    <div className="search-wrapper">
        <i className="bi bi-search"></i>

       <input
  type="text"
  className="search-input"
  placeholder="Search stickers..."
  value={search}
  onChange={(e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  }}
/>
    </div>

    <div className="table-responsive">
        <table className="premium-table">

            <thead>
                <tr>
                    <th>#</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Cost</th>
                    <th>Action</th>
                </tr>
            </thead>

            <tbody>
                {currentStickers.map((s, index) => (
                    <tr key={s._id}>
                        <td>
  {indexOfFirstSticker + index + 1}
</td>
                        <td>
                            <img
                                src={absImage(s.imageUrl)}
                                alt={s.name}
                                className="sticker-preview"
                            />
                        </td>

                        <td>{s.name}</td>
                        <td>{s.slug}</td>

                        <td>
                            <span className="coin-badge">
                                {s.cost} Coins
                            </span>
                        </td>

                        <td>
                            <button
                                className="delete-btn"
                                onClick={() => deleteSticker(s._id)}
                            >
                                <i className="bi bi-trash3-fill"></i>
                            </button>
                        </td>
                    </tr>
                ))}
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

    {getPageNumbers().map((page) => (
      <button
        key={page}
        className={
          currentPage === page
            ? "active-page"
            : ""
        }
        onClick={() =>
          setCurrentPage(page)
        }
      >
        {page}
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
    

</div>

</div>

     {showForm && (
  <div className="admin-modal-overlay">

    <div className="admin-modal">

      <div className="admin-modal-header">

        <div>
          <h3>Add New Sticker</h3>
          <p>Create a new sticker for your users</p>
        </div>

        <button
          className="modal-close-btn"
          onClick={() => {
            setShowForm(false);
            setForm({
              name: "",
              slug: "",
              imageUrl: "",
              cost: "",
              isCustom: true
            });
            setMsg("");
            setSaving(false);
          }}
        >
          <i className="bi bi-x-lg"></i>
        </button>

      </div>

      <form className="admin-form" onSubmit={submitSticker}>

        <div className="form-group">

          <label>
            <i className="bi bi-emoji-smile me-2"></i>
            Sticker Name
          </label>

          <input
            type="text"
            placeholder="Enter sticker name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            required
          />

        </div>

        <div className="form-group">

          <label>
            <i className="bi bi-link-45deg me-2"></i>
            Sticker Slug
          </label>

          <input
            type="text"
            placeholder="heart-love"
            value={form.slug}
            onChange={(e) =>
              setForm({ ...form, slug: e.target.value })
            }
            required
          />

        </div>

        <div className="form-group">

          <label>
            <i className="bi bi-image me-2"></i>
            Sticker Image
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setForm({
                ...form,
                image: e.target.files[0]
              })
            }
          />

        </div>

        <div className="form-group">

          <label>
            <i className="bi bi-coin me-2"></i>
            Sticker Cost
          </label>

          <input
            type="number"
            placeholder="100"
            value={form.cost}
            onChange={(e) =>
              setForm({
                ...form,
                cost: e.target.value
              })
            }
            required
          />

        </div>

        {msg && (
          <div
            className={`form-message ${
              msg.includes("created")
                ? "success-msg"
                : "error-msg"
            }`}
          >
            {msg}
          </div>
        )}

        <div className="modal-footer">

          <button
            type="button"
            className="cancel-btn"
            onClick={() => {
              setShowForm(false);
              setForm({
                name: "",
                slug: "",
                imageUrl: "",
                cost: "",
                isCustom: true
              });
              setMsg("");
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="save-btn"
            disabled={saving}
          >
            <i className="bi bi-check-circle me-2"></i>

            {saving ? "Saving..." : "Create Sticker"}

          </button>

        </div>

      </form>

    </div>

  </div>



)}

</>

  );
}