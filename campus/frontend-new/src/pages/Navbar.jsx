import { useEffect, useRef, useState } from "react";
import CampusLogo from "../assets/campus-logo.svg";
import * as api from "../api";

function NotificationBell({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const load = () => {
    api.fetchNotifications().then((d) => {
      setItems(d.results || []);
      setUnread(d.unread_count || 0);
    }).catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen((o) => !o);
  };

  const handleMarkAll = (e) => {
    e.stopPropagation();
    api.markAllNotificationsRead().then(load);
  };

  const handleItemClick = (n) => {
    if (!n.is_read) api.markNotificationRead(n.id).then(load);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={handleOpen}
        style={{
          position: "relative", background: "rgba(255,255,255,0.08)",
          border: "none", borderRadius: 10, width: 38, height: 38, cursor: "pointer", fontSize: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff",
            borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "1px 5px", minWidth: 16,
          }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div style={{
          position: "absolute", top: 46, right: 0, width: 320, maxHeight: 380, overflowY: "auto",
          background: "#0b1020", border: "1px solid rgba(56,189,248,0.18)", borderRadius: 14,
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)", zIndex: 200, padding: 10,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 6px 10px" }}>
            <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13 }}>Notifications</span>
            {unread > 0 && (
              <span onClick={handleMarkAll} style={{ color: "#38bdf8", fontSize: 11, cursor: "pointer" }}>Mark all read</span>
            )}
          </div>
          {items.length === 0 && (
            <div style={{ color: "#64748b", fontSize: 12, padding: "12px 6px" }}>No notifications yet.</div>
          )}
          {items.map((n) => (
            <div
              key={n.id}
              onClick={() => handleItemClick(n)}
              style={{
                padding: "10px 8px", borderRadius: 10, cursor: "pointer", marginBottom: 4,
                background: n.is_read ? "transparent" : "rgba(56,189,248,0.08)",
              }}
            >
              <div style={{ color: "#e2e8f0", fontSize: 12.5, fontWeight: 600 }}>{n.title}</div>
              <div style={{ color: "#94a3b8", fontSize: 11.5, marginTop: 2 }}>{n.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar({ currentPage = "home", onNavigate, user, onLogout }) {
  const [hovered, setHovered] = useState(null);

  const baseLinks = [
    { label: "Home", page: "home" },
    { label: "Jobs", page: "jobs" },
    { label: "Companies", page: "companies" },
    { label: "Analytics", page: "analytics" },
  ];
  const studentLinks = [
    { label: "Applications", page: "applications" },
    { label: "Mock Interview", page: "mockinterview" },
    { label: "Dashboard", page: "dashboard" },
  ];
  const recruiterLinks = [
    { label: "Recruiter Dashboard", page: "recruiter" },
  ];
  const adminLinks = [
    { label: "Admin", page: "admin" },
  ];

  let links = [...baseLinks];
  const isAdmin = user?.is_staff || user?.is_superuser;
  if (user?.role === "student" && !isAdmin) links = [...links, ...studentLinks];
  if (user?.role === "recruiter" && !isAdmin) links = [...links, ...recruiterLinks];
  if (isAdmin) links = [...links, ...adminLinks];

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <a
          href="#"
          style={styles.logo}
          onClick={(event) => {
            event.preventDefault();
            if (onNavigate) onNavigate("home");
          }}
        >
          <img src={CampusLogo} alt="Campus Hire logo" style={styles.logoImage} />
          <span style={styles.logoText}>
            <span style={styles.logoAccent}>Campus</span> Hire
          </span>
        </a>

        {/* Nav links */}
        <div style={styles.links}>
          {links.map((link) => {
            const isActive = currentPage === link.page;
            return (
              <a
                key={link.page}
                href="#"
                style={{
                  ...styles.link,
                  color: hovered === link.label || isActive ? "#38bdf8" : "#cbd5e1",
                  borderBottom: isActive ? "2px solid #38bdf8" : "2px solid transparent",
                }}
                onClick={(event) => {
                  event.preventDefault();
                  if (onNavigate) onNavigate(link.page);
                }}
                onMouseEnter={() => setHovered(link.label)}
                onMouseLeave={() => setHovered(null)}
              >
                {link.label}
              </a>
            );
          })}
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          {user ? (
            <>
              <NotificationBell onNavigate={onNavigate} />
              <a
                href="#"
                style={styles.signIn}
                onClick={(event) => {
                  event.preventDefault();
                  if (onNavigate) onNavigate("profile");
                }}
              >
                Hi, {user.first_name || user.username}
              </a>
              <button
                style={styles.getStarted}
                onClick={() => onLogout && onLogout()}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <a
                href="#"
                style={styles.signIn}
                onClick={(event) => {
                  event.preventDefault();
                  if (onNavigate) onNavigate("login");
                }}
              >
                Sign in
              </a>
              <button
                style={styles.getStarted}
                onClick={() => onNavigate && onNavigate("register")}
              >
                Get started →
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(10, 12, 20, 0.92)",
    color: "#f1f5f9",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(56, 189, 248, 0.15)",
  },
  inner: {
    width: "100%",
    padding: "0 28px",
    height: 70,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: 1400,
    margin: "0 auto",
    gap: 16,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    textDecoration: "none",
    cursor: "pointer",
    flexShrink: 0,
  },
  logoImage: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "rgba(14,165,233,0.14)",
    padding: 8,
    objectFit: "contain",
    border: "1px solid rgba(56,189,248,0.18)",
    boxShadow: "0 10px 28px rgba(14,165,233,0.08)",
  },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    color: "#f1f5f9",
    letterSpacing: "-0.3px",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  logoAccent: {
    color: "#38bdf8",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: 18,
    flexWrap: "wrap",
    flex: 1,
    justifyContent: "center",
  },
  link: {
    fontSize: 13.5,
    fontWeight: 500,
    textDecoration: "none",
    transition: "color 0.2s",
    letterSpacing: "0.1px",
    whiteSpace: "nowrap",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexShrink: 0,
  },
  signIn: {
    fontSize: 14,
    fontWeight: 500,
    color: "#94a3b8",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  getStarted: {
    background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "9px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.1px",
    whiteSpace: "nowrap",
  },
};
