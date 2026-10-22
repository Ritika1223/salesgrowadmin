import { ToastContainer } from "react-toastify";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import adminRoute from "./View/Admin/Route";
import "./View/css/bootstrap.css";
import "./View/css/theme.css";
import "./View/css/style.css";
import "./View/css/theme-apply.css";

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/admin/login" replace /> },
  ...adminRoute,
]);

export default function App() {
  return (
    <>
      <ToastContainer />
      <RouterProvider router={router} />
    </>
  );
}
