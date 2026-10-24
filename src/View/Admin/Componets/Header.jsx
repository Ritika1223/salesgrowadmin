import React, { useState } from "react";
import { Outlet } from "react-router-dom";
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}

function handleLogout() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("refreshToken"); // if you use refresh tokens
  sessionStorage.removeItem("admin_token ");
  window.location.href = "/admin/login";
}

const NAV_LINKS = [
  {
    to: "admin/dashboard",
    icon: <i className="bi bi-grid-1x2-fill"></i>,
    label: "Dashboard",
  },
  {
    to: "admin/bankDetail",
    icon: <i className="bi bi-bank"></i>,
    label: "Bank Detail",
  },
  {
    to: "admin/add-fund",
    icon: <i className="bi bi-coin"></i>,
    label: "Add Fund",
  },
  {
    icon: <i className="bi bi-cash-coin"></i>,
    label: "Fund",
    children: [
      {
        to: "admin/fund/requests",
        icon: <i className="bi bi-check2-square"></i>,
        label: "Fund Requests",
      },
      {
        to: "admin/fund/report",
        icon: <i className="bi bi-file-earmark-text-fill"></i>,
        label: "Fund Request Report",
      },
    ],
  },

  {
    icon: <i className="bi bi-cash-stack"></i>,
    label: "Withdrawal",
    children: [
      {
        to: "admin/withdraw/requests",
        icon: <i className="bi bi-check2-square"></i>,
        label: "Withdrawal Requests",
      },
      {
        to: "admin/withdraw/report",
        icon: <i className="bi bi-file-earmark-text"></i>,
        label: "Withdrawal Request Report",
      },
    ],
  },

  {
    to: "admin/users",
    icon: <i className="bi bi-person-circle"></i>,
    label: "All Users",
  },
  {
    to: "admin/plan-requests",
    icon: <i className="bi bi-card-checklist"></i>,
    label: "Plan Requests",
  },
  {
    to: "admin/payment-history",
    icon: <i className="bi bi-receipt"></i>,
    label: "Payment History",
  },
  {
    to: "admin/host-requests",
    icon: <i className="bi bi-broadcast"></i>,
    label: "Host Requests",
  },
  {
    to: "admin/groups",
    icon: <i className="bi bi-chat-dots-fill"></i>,
    label: "Groups",
  },
  {
    to: "admin/stickers",
    icon: <i className="bi bi-emoji-smile-fill"></i>,
    label: "Stickers",
  },

  {
    to: "",
    icon: <i className="bi bi-box-arrow-right"></i>,
    label: "Logout",
    onClick: handleLogout
  }
];

export default function Header() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState(() => {
    const path = window.location.pathname;
    const open = {};
    if (path.startsWith("/admin/fund")) open.Fund = true;
    if (path.startsWith("/admin/withdraw")) open.Withdrawal = true;
    return open;
  });
  const hrefFor = (to) => (to.startsWith("/") ? to : `/${to}`);

  const linkActive = (to) => {
    if (!to) return false;
    const windowPath = window.location.pathname.replace(/\/$/, "");
    const linkPath = hrefFor(to).replace(/\/$/, "");
    if (linkPath === "/admin/dashboard") return windowPath === linkPath;
    return windowPath.startsWith(linkPath);
  };

  const renderLink = ({ to, icon, label, onClick }) => {
    const active = linkActive(to);
    return (
      <a
        key={label}
        href={!to ? "#" : hrefFor(to)}
        className={active ? "active" : ""}
        onClick={(e) => {
          if (onClick) {
            e.preventDefault();
            onClick();
          }
          if (isMobile) setSidebarOpen(false);
        }}
      >
        <span className="ico">{icon}</span>
        {label}
      </a>
    );
  };

  const renderNavLinks = () =>
    NAV_LINKS.map((item) => {
      if (!item.children) return renderLink(item);
      const open = Boolean(openMenus[item.label]);
      return (
        <div className={`nav-group${open ? " open" : ""}`} key={item.label}>
          <button
            type="button"
            className="nav-group-label"
            onClick={() =>
              setOpenMenus((prev) => ({
                ...prev,
                [item.label]: !prev[item.label],
              }))
            }
          >
            <span className="ico">{item.icon}</span>
            {item.label}
            <i className={`bi ${open ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
          </button>
          {open && (
            <div className="nav-group-links">
              {item.children.map((child) => renderLink(child))}
            </div>
          )}
        </div>
      );
    });

  return (
    <>
      <div className="app ">
        <aside
          className={`sidebar${isMobile ? ' mobile' : ''}${isMobile && !sidebarOpen ? ' hidden' : ''}`}
          data-open={isMobile ? (sidebarOpen ? "true" : "false") : undefined}
        >
          {isMobile && (
            <div
              className="cp-mobile-sidebar-topbar"
            >
              <img className="kk-wordmark" src="/images/logo2.png" alt="KaKowa" />
              <button
                aria-label="Close menu"
                onClick={() => setSidebarOpen(false)}
                className="cp-mobile-sidebar-close"
              >✕</button>
            </div>
          )}
          {/* <div className="brand">
            <img src="/images/salesgrow.png" alt="SalesGrow" />
          </div> */}
          <div className="brand">
            <img className="kk-wordmark" src="/images/logo2.png" alt="KaKowa" />
          </div>
     
          <nav className="nav">
            {renderNavLinks()}
          </nav>
          <div className="divider" />
        </aside>
        {isMobile && (
          <button
            className={`sidebar-toggle${sidebarOpen ? " is-hidden" : ""}`}
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
          >
            <span aria-hidden>☰</span>
          </button>
        )}
        <main>
          <Outlet />
        </main>
      </div>
      <div className="bottom-nav">
        <div className="bar">
          <a className="nav-btn" href="/admin/dashboard">
            <span className="ico">
              <i className="bi bi-house-door-fill"></i>
            </span>
          </a>

          <a className="nav-btn" href="/admin/fund/requests">
            <span className="ico">
              <i className="bi bi-cash-coin"></i>
            </span>
          </a>

          <a className="nav-btn" href="/admin/users">
            <span className="ico">
              <i className="bi bi-people-fill"></i>
            </span>
          </a>

          <button
            type="button"
            className="nav-btn"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="ico">
              <i className="bi bi-list"></i>
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
