import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Header from "./Header";
import { isAdminLoggedIn } from "../../../utils/adminAuth";

export default function AdminHeaderLayout() {
  const location = useLocation();

  // Use the correct admin auth checker to avoid mismatched auth logic.
  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  // Render the Header and nested admin routes
  return (
    <>
      <Header />
      <div className="admin-content">
      </div>
    </>
  );
}
