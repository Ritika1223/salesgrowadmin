import React from "react";
import { Navigate } from "react-router-dom";
import AdminLogin from "./Pages/AdminLogin";
import AdminDashboard from "./Pages/AdminDashboard";
import Users from "./Pages/Users";
import Groups from "./Pages/Groups";
import Stickers from "./Pages/Stickers";
import AdminHeaderLayout from "./Componets/AdminHeaderLayout";
import { isAdminLoggedIn } from "../../utils/adminAuth";
import BankDetailPage from "./Pages/BankDetail";
import PaymentHistoryPage from "./Pages/PaymentHistory";
import AddFundPage from "./Pages/AddFund";
import HostRequestsPage from "./Pages/HostRequests";
import PlanRequests from "./Pages/PlanRequests";
import AdminFundRequests from "./Pages/AdminFundRequests";
import AdminWithdrawals from "./Pages/AdminWithdrawals";
import AdminRoiToRoiIncome from "./Pages/AdminRoiToRoiIncome";
import AdminUserControl from "./Pages/AdminUserControl";

function AdminGuard({ children }) {
  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function AdminGuardLogin() {
  if (isAdminLoggedIn()) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <AdminLogin />;
}

const Routes = [
  {
    path: "/admin/login",
    element: <AdminGuardLogin />
  },
  {
    path: "/admin",
    element: (
      <AdminGuard>
        <AdminHeaderLayout />
      </AdminGuard>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <AdminDashboard /> },
      { path: "users", element: <Users /> },
      { path: "bankDetail", element: <BankDetailPage /> },
      { path: "add-fund", element: <AddFundPage /> },
      { path: "fund/requests", element: <AdminFundRequests /> },
      { path: "fund/report", element: <AdminFundRequests reportOnly /> },
      { path: "withdraw/requests", element: <AdminWithdrawals /> },
      { path: "withdraw/report", element: <AdminWithdrawals reportOnly /> },
      { path: "income/roi-to-roi", element: <AdminRoiToRoiIncome /> },
      { path: "stop-roi", element: <AdminUserControl mode="roi" /> },
      { path: "stop-withdraw", element: <AdminUserControl mode="withdraw" /> },
      { path: "plan-requests", element: <PlanRequests /> },
      { path: "payment-history", element: <PaymentHistoryPage /> },
      { path: "host-requests", element: <HostRequestsPage /> },
      { path: "groups", element: <Groups /> },
      { path: "stickers", element: <Stickers /> }
    ]
  }
];

export default Routes;
