import React, { useEffect, useState } from "react";
import { API_ADMIN } from "../../../config/api";
import { getAdminToken, clearAdminSession } from "../../../utils/adminAuth";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    nickname: "",
    email: "",
    phone: "",
    password: "",
    city: "",
    age: "",
    sex: "",
    category: "",
    about: "",
    walletBalance: "",
    diamondBalance: "",
    plan: "",
    isActive: false,
    profileMode: "user",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

 const filteredUsers = users.filter((user) => {
  const matchesSearch =
    `${user.name} ${user.email} ${user.phone || ""} ${user.city || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());

  const isInactive = Boolean(user.isDisabled);
  const matchesStatus =
    statusFilter === "all"
      ? true
      : statusFilter === "inactive" || statusFilter === "blocked"
        ? isInactive
        : !isInactive;

  return matchesSearch && matchesStatus;
});

  const totalPages = Math.ceil(
    filteredUsers.length / usersPerPage
  );

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;

  const currentUsers = filteredUsers.slice(
    indexOfFirstUser,
    indexOfLastUser
  );

  const loadUsers = async () => {
    const token = getAdminToken();
    if (!token) {
      navigate("/admin/login");
      return;
    }

    try {
      const res = await fetch(`${API_ADMIN}/users`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  const adminHeaders = () => {
    const token = getAdminToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const toggleUserStatus = async (user) => {
    const nextDisabled = !user.isDisabled;
    const result = await Swal.fire({
      title: nextDisabled ? "Inactivate this user?" : "Activate this user?",
      text: nextDisabled
        ? "They will not be able to log in until you activate them again."
        : "They will be able to log in again.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: nextDisabled ? "Inactivate" : "Activate",
    });
    if (!result.isConfirmed) return;

    const token = getAdminToken();
    if (!token) {
      navigate("/admin/login");
      return;
    }

    setActionId(user._id);
    try {
      const res = await fetch(`${API_ADMIN}/users/${user._id}/status`, {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({ isDisabled: nextDisabled }),
      });
      if (res.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Could not update user");
      }
      setUsers((prev) =>
        prev.map((item) =>
          item._id === user._id ? { ...item, isDisabled: nextDisabled } : item
        )
      );
      Swal.fire("Done", data.message || "Status updated", "success");
    } catch (err) {
      Swal.fire("Error", err.message || "Could not update user", "error");
    } finally {
      setActionId("");
    }
  };

  const openEdit = (user) => {
    setEditUser(user);
    setEditForm({
      name: user.name || "",
      nickname: user.nickname || "",
      email: user.email || "",
      phone: user.phone || "",
      password: user.password || "",
      city: user.city || "",
      age: user.age || "",
      sex: user.sex || "",
      category: user.category || "",
      about: user.about || "",
      walletBalance: user.walletBalance ?? 0,
      diamondBalance: user.diamondBalance ?? 0,
      plan: user.plan || "",
      isActive: Boolean(user.isActive),
      profileMode: user.profileMode || "user",
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    const token = getAdminToken();
    if (!token) {
      navigate("/admin/login");
      return;
    }

    setEditSaving(true);
    try {
      const res = await fetch(`${API_ADMIN}/users/${editUser._id}`, {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({
          ...editForm,
          age: editForm.age === "" ? "" : Number(editForm.age),
          walletBalance: Number(editForm.walletBalance),
          diamondBalance: Number(editForm.diamondBalance),
          isActive: Boolean(editForm.isActive),
        }),
      });
      if (res.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Could not update user");
      }
      setUsers((prev) =>
        prev.map((item) =>
          item._id === editUser._id ? { ...item, ...data.user } : item
        )
      );
      setEditUser(null);
      Swal.fire("Done", data.message || "Profile updated", "success");
    } catch (err) {
      Swal.fire("Error", err.message || "Could not update user", "error");
    } finally {
      setEditSaving(false);
    }
  };

  const deleteUser = async (user) => {
    const result = await Swal.fire({
      title: "Delete this profile?",
      text: "This will permanently delete the user and related chat, wallet, and request data. This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete completely",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;

    const token = getAdminToken();
    if (!token) {
      navigate("/admin/login");
      return;
    }

    setActionId(user._id);
    try {
      const res = await fetch(`${API_ADMIN}/users/${user._id}`, {
        method: "DELETE",
        headers: adminHeaders(),
      });
      if (res.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Could not delete user");
      }
      setUsers((prev) => prev.filter((item) => item._id !== user._id));
      Swal.fire("Deleted", data.message || "User deleted", "success");
    } catch (err) {
      Swal.fire("Error", err.message || "Could not delete user", "error");
    } finally {
      setActionId("");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (

    <div className="admin-users-page">

      <div className="users-header-card">

        <div className="header-left">

          <div className="header-icon">
            <i className="bi bi-people-fill"></i>
          </div>

          <div>
            <h2>Users Management</h2>
            <p>Manage and monitor all registered users</p>
          </div>

        </div>

        <button
          className="dashboard-btn"
          onClick={() => navigate("/admin/dashboard")}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Dashboard
        </button>

      </div>

      <div className="users-table-card">

       <div className="search-filter-row">

  <div className="search-wrapper">
    <i className="bi bi-search"></i>

    <input
      type="text"
      className="search-input"
      placeholder="Search users..."
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        setCurrentPage(1);
      }}
    />
  </div>

  <div className="filter-wrapper">
    <i className="bi bi-funnel-fill"></i>

    <select
      className="status-filter"
      value={statusFilter}
      onChange={(e) => {
        setStatusFilter(e.target.value);
        setCurrentPage(1);
      }}
    >
      <option value="all">All Users</option>
      <option value="active">Active Users</option>
      <option value="blocked">Blocked Users</option>
      <option value="inactive">Inactive Users</option>
    </select>
  </div>

</div>

        {loading ? (
          <div className="empty-state">Loading Users...</div>
        ) : users.length === 0 ? (
          <div className="empty-state">No users found</div>
        ) : (
          <div className="table-responsive">

            <table className="premium-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>User</th>
                  <th>Phone</th>
                  <th>Password</th>
                  <th>Coins</th>
                  <th>Referrals</th>
                  <th>Total Earning</th>
                  <th>Status</th>
                  <th>Join Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {currentUsers.map((u, index) => (
                  <tr key={u._id}>

                    <td>{indexOfFirstUser + index + 1}</td>

                    <td>
                      <div className="user-info">
                        <div>
                          <div className="user-name">{u.name}</div>
                          <div className="user-email">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td>{u.phone || "-"}</td>

                    <td>
                      <span className="password-badge">
                        {u.password || "-"}
                      </span>
                    </td>

                    <td>
                      <span className="coin-badge">
                        {u.walletBalance || 0}
                      </span>
                    </td>

                    <td>
                      <span className="referral-badge">
                        {u.totalReferrals|| 0}
                      </span>
                    </td>

                    <td>
                      <span className="group-badge">
                        {u.totalEarning || 0}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          u.isDisabled
                            ? "status-badge blocked"
                            : "status-badge active"
                        }
                      >
                        {u.isDisabled ? "Inactive" : "Active"}
                      </span>
                    </td>
               

                    <td>
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString()
                        : "-"}
                    </td>

                    <td>
                    <div className="user-action-btns">
  <button
    type="button"
    className="user-edit-btn"
    disabled={actionId === u._id}
    onClick={() => openEdit(u)}
  >
    Edit
  </button>
  <button
    type="button"
    className={u.isDisabled ? "user-activate-btn" : "user-inactive-btn"}
    disabled={actionId === u._id}
    onClick={() => toggleUserStatus(u)}
  >
    {u.isDisabled ? "Activate" : "Inactive"}
  </button>

  <button
    type="button"
    className="user-delete-btn"
    disabled={actionId === u._id}
    onClick={() => deleteUser(u)}
  >
    Delete
  </button>
</div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>

            {totalPages > 1 && (
              <div className="custom-pagination">

                {/* Previous */}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => prev - 1)
                  }
                  disabled={currentPage === 1}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>

                {/* Page Numbers */}
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

                {/* Next */}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => prev + 1)
                  }
                  disabled={currentPage === totalPages}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>

              </div>
            )}

          </div>
        )}

      </div>

      {editUser && (
        <div className="wallet-modal">
          <div className="wallet-modal-box payment-modal">
            <button
              className="wallet-close-btn"
              type="button"
              onClick={() => setEditUser(null)}
            >
              <i className="bi bi-x-lg"></i>
            </button>
            <div className="d-flex align-items-center justify-content-center">
              <div className="wallet-modal-icon">
                <i className="bi bi-pencil-square"></i>
              </div>
              <h2>Edit user profile</h2>
            </div>
            <form className="payment-form" onSubmit={saveEdit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  className="wallet-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nickname</label>
                <input
                  className="wallet-input"
                  value={editForm.nickname}
                  onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="wallet-input"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  className="wallet-input"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  className="wallet-input"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  className="wallet-input"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  min="18"
                  max="99"
                  className="wallet-input"
                  value={editForm.age}
                  onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select
                  className="wallet-input"
                  value={editForm.sex}
                  onChange={(e) => setEditForm({ ...editForm, sex: e.target.value })}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  className="wallet-input"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>About</label>
                <textarea
                  className="wallet-input"
                  rows="3"
                  value={editForm.about}
                  onChange={(e) => setEditForm({ ...editForm, about: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Wallet coins</label>
                <input
                  type="number"
                  min="0"
                  className="wallet-input"
                  value={editForm.walletBalance}
                  onChange={(e) =>
                    setEditForm({ ...editForm, walletBalance: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Diamonds</label>
                <input
                  type="number"
                  min="0"
                  className="wallet-input"
                  value={editForm.diamondBalance}
                  onChange={(e) =>
                    setEditForm({ ...editForm, diamondBalance: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Plan</label>
                <select
                  className="wallet-input"
                  value={editForm.plan}
                  onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                >
                  <option value="">No plan</option>
                  <option value="BASIC">BASIC</option>
                  <option value="STANDARD">STANDARD</option>
                  <option value="PREMIUM">PREMIUM</option>
                </select>
              </div>
              <div className="form-group">
                <label>Plan status</label>
                <select
                  className="wallet-input"
                  value={editForm.isActive ? "true" : "false"}
                  onChange={(e) =>
                    setEditForm({ ...editForm, isActive: e.target.value === "true" })
                  }
                >
                  <option value="false">Inactive</option>
                  <option value="true">Active</option>
                </select>
              </div>
              <div className="form-group">
                <label>Profile mode</label>
                <select
                  className="wallet-input"
                  value={editForm.profileMode}
                  onChange={(e) =>
                    setEditForm({ ...editForm, profileMode: e.target.value })
                  }
                >
                  <option value="user">User</option>
                  <option value="host">Host</option>
                </select>
              </div>
              <div className="wallet-modal-actions">
                <button
                  type="button"
                  className="wallet-cancel-btn"
                  onClick={() => setEditUser(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="wallet-submit-btn" disabled={editSaving}>
                  {editSaving ? "Saving..." : "Save profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>

  );
}