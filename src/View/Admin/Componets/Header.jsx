import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { API_ADMIN } from "../../../config/api";
import { getAdminToken } from "../../../utils/adminAuth";
import { ADMIN_REQUESTS_CHANGED } from "../../../utils/adminRequests";
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
    icon: <i className="bi bi-graph-up-arrow"></i>,
    label: "Income",
    children: [
      {
        to: "admin/income/roi-to-roi",
        icon: <i className="bi bi-arrow-repeat"></i>,
        label: "ROI to ROI Income",
      },
    ],
  },

  {
    to: "admin/coin-withdrawals",
    icon: <i className="bi bi-coin"></i>,
    label: "Coin Withdrawals",
  },
  {
    icon: <i className="bi bi-cash-stack"></i>,
    label: "Withdrawal",
    countKey: "withdrawal",
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

  // {
  //   icon: <i className="bi bi-sliders"></i>,
  //   label: "User Control",
  //   children: [
  //     {
  //       to: "admin/stop-roi",
  //       icon: <i className="bi bi-graph-up-arrow"></i>,
  //       label: "Stop ROI",
  //     },
  //     {
  //       to: "admin/stop-withdraw",
  //       icon: <i className="bi bi-cash-stack"></i>,
  //       label: "Stop Withdrawal",
  //     },
  //   ],
  // },

  {
    to: "admin/users",
    icon: <i className="bi bi-person-circle"></i>,
    label: "All Users",
  },
  {
    to: "admin/upline",
    icon: <i className="bi bi-diagram-3-fill"></i>,
    label: "Upline",
  },
  {
    to: "admin/downline",
    icon: <i className="bi bi-diagram-2-fill"></i>,
    label: "Downline",
  },
  {
    to: "admin/plan-requests",
    icon: <i className="bi bi-card-checklist"></i>,
    label: "Plan Requests",
  },
  {
    to: "admin/payment-history",
    icon: <i className="bi bi-receipt"></i>,
    label: "Coins Request ",
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

const COUNT_BY_PATH = {
  "admin/plan-requests": "plan",
  "admin/payment-history": "coins",
  "admin/host-requests": "host",
  "admin/withdraw/requests": "withdrawal",
};

function requestCount(counts, item) {
  const key = item.countKey || COUNT_BY_PATH[item.to];
  const value = key ? Number(counts[key]) || 0 : 0;
  return value > 0 ? value : 0;
}

function CountBadge({ count }) {
  if (!count) return null;
  return <span className="nav-count">{count > 99 ? "99+" : count}</span>;
}

export default function Header() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [counts, setCounts] = useState({
    plan: 0,
    coins: 0,
    host: 0,
    withdrawal: 0,
  });
  const [openMenus, setOpenMenus] = useState(() => {
    const path = window.location.pathname;
    const open = {};
    if (path.startsWith("/admin/fund")) open.Fund = true;
    if (path.startsWith("/admin/withdraw")) open.Withdrawal = true;
    if (path.startsWith("/admin/income")) open.Income = true;
    if (path.startsWith("/admin/stop")) open["User Control"] = true;
    return open;
  });
  useEffect(() => {
    let stopped = false;

    const loadCounts = async () => {
      const token = getAdminToken();
      if (!token || stopped) return;
      try {
        const res = await fetch(`${API_ADMIN}/request-counts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (stopped) return;
        setCounts({
          plan: Number(data.plan) || 0,
          coins: Number(data.coins) || 0,
          host: Number(data.host) || 0,
          withdrawal: Number(data.withdrawal) || 0,
        });
      } catch {
        // Keep the last counts if the request fails.
      }
    };

    loadCounts();
    const timer = setInterval(loadCounts, 20000);
    window.addEventListener("focus", loadCounts);
    window.addEventListener(ADMIN_REQUESTS_CHANGED, loadCounts);
    return () => {
      stopped = true;
      clearInterval(timer);
      window.removeEventListener("focus", loadCounts);
      window.removeEventListener(ADMIN_REQUESTS_CHANGED, loadCounts);
    };
  }, [location.pathname]);

  const hrefFor = (to) => (to.startsWith("/") ? to : `/${to}`);

  const linkActive = (to) => {
    if (!to) return false;
    const windowPath = window.location.pathname.replace(/\/$/, "");
    const linkPath = hrefFor(to).replace(/\/$/, "");
    if (linkPath === "/admin/dashboard") return windowPath === linkPath;
    return windowPath.startsWith(linkPath);
  };

  const renderLink = ({ to, icon, label, onClick, countKey }) => {
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
        <span className="nav-label-text">{label}</span>
        <CountBadge count={requestCount(counts, { to, countKey })} />
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
            <span className="nav-label-text">{item.label}</span>
            <CountBadge count={requestCount(counts, item)} />
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
            <div className="cp-mobile-sidebar-topbar">
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setSidebarOpen(false)}
                className="cp-mobile-sidebar-close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          )}
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
