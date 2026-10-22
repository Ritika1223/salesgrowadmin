import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

export default function AdminLayout() {
  const location = useLocation();

  const menu = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Users", path: "/admin/users" },
    { name: "Groups", path: "/admin/groups" },
    { name: "Stickers", path: "/admin/stickers" }
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <div style={{
        width: "220px",
        background: "#111",
        color: "#fff",
        padding: "20px"
      }}>
        <h3>Admin</h3>

        {menu.map((m) => (
          <Link
            key={m.path}
            to={m.path}
            style={{
              display: "block",
              padding: "10px",
              marginTop: "10px",
              color: location.pathname === m.path ? "#fff" : "#aaa",
              background: location.pathname === m.path ? "#ff4d4f" : "transparent",
              borderRadius: "6px",
              textDecoration: "none"
            }}
          >
            {m.name}
          </Link>
        ))}
      </div>

      {/* Page Content */}
      <div style={{ flex: 1, padding: "20px" }}>
        <Outlet />
      </div>
    </div>
  );
}