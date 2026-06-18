import { useState, useEffect, useRef, useCallback } from "react";
import { fetchUsers, toggleUserStatus } from "../services/serviceDeactivate";
<<<<<<< Updated upstream

const ROLE_COLORS = {
  organizer: { bg: "#EEF2FF", text: "#4338CA" },
  venue_owner: { bg: "#FFF7ED", text: "#C2410C" },
  staff: { bg: "#F0FDF4", text: "#166534" },
  vendor: { bg: "#FDF4FF", text: "#7E22CE" },
  guest: { bg: "#F9FAFB", text: "#374151" },
=======
import "../components/componentTheme.css";
import { P, GlassPanel, icons } from "../components/componentTheme";
import { VscHome, VscCalendar, VscPerson, VscAccount, VscPersonAdd, VscTrash} from "react-icons/vsc";
import Dock from "../components/componentDock";
import { useNavigate } from "react-router-dom";
import "./pageDeactivate.css";
import "./pageOrganizerDashboard.css";
import AppHeader from "../components/componentAppHeader";

const ROLE_COLORS = {
  organizer: { bg: "rgba(139, 109, 255, 0.14)", text: "#9b7cff", border: "rgba(139, 109, 255, 0.35)" },
  venue_owner: { bg: "rgba(245, 166, 35, 0.12)", text: "#f5a623", border: "rgba(245, 166, 35, 0.35)" },
  staff: { bg: "rgba(77, 231, 227, 0.12)", text: "#4de7e3", border: "rgba(77, 231, 227, 0.35)" },
  vendor: { bg: "rgba(255, 91, 159, 0.12)", text: "#ff6fb1", border: "rgba(255, 91, 159, 0.35)" },
};

const DEFAULT_ROLE_STYLE = {
  bg: "rgba(255, 255, 255, 0.08)",
  text: "rgba(232, 232, 240, 0.75)",
  border: "rgba(255, 255, 255, 0.14)",
};

const ROLE_LABELS = {
  organizer: "Organizer",
  venue_owner: "Venue Owner",
  staff: "Staff",
  vendor: "Vendor",
>>>>>>> Stashed changes
};
const ROLES = Object.keys(ROLE_COLORS);

const ROLE_FILTER_ITEMS = [
  { role: "all", label: "All", color: P.blue },
  { role: "organizer", label: "Organizer", color: "#9b7cff" },
  { role: "venue_owner", label: "Venue Owner", color: P.amber },
  { role: "staff", label: "Staff", color: "#4de7e3" },
  { role: "vendor", label: "Vendor", color: "#ff6fb1" },
];

function RoleFilterTile({ role, label, color, count, filterRole, onSelect, index }) {
  const isActive = filterRole === role;

  return (
    <button
      type="button"
      className="role-filter-tile"
      onClick={() => onSelect(role)}
      style={{
        background: isActive
          ? `linear-gradient(135deg, ${color}22 0%, ${color}10 100%)`
          : "rgba(19,19,30,0.72)",
        border: `1px solid ${isActive ? `${color}55` : P.border}`,
        transform: isActive ? "translateY(-3px)" : "translateY(0)",
        boxShadow: isActive
          ? `0 0 0 1px ${color}33, 0 8px 24px ${color}22, inset 0 1px 0 rgba(255,255,255,0.06)`
          : "inset 0 1px 0 rgba(255,255,255,0.04)",
        animation: `roleTileIn 0.3s ease ${index * 0.05}s both`,
      }}
      onMouseEnter={(event) => {
        if (!isActive) {
          event.currentTarget.style.background = `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`;
          event.currentTarget.style.borderColor = `${color}44`;
        }
      }}
      onMouseLeave={(event) => {
        if (!isActive) {
          event.currentTarget.style.background = "rgba(19,19,30,0.72)";
          event.currentTarget.style.borderColor = P.border;
        }
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 900,
          color,
          lineHeight: 1,
          fontFamily: "var(--font-display), system-ui, sans-serif",
          letterSpacing: "-0.04em",
        }}
      >
        {count}
      </div>
      <div
        style={{
          fontSize: 10,
          color: isActive ? color : P.muted,
          marginTop: 6,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.09em",
        }}
      >
        {label}
      </div>
      {isActive && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "20%",
            right: "20%",
            height: 2,
            background: color,
            borderRadius: "2px 2px 0 0",
            opacity: 0.7,
          }}
        />
      )}
    </button>
  );
}

function Avatar({ fullname = "", active }) {
  const initials = fullname
    ? fullname
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      background: active ? "#DBEAFE" : "#F1F5F9",
      color: active ? "#1D4ED8" : "#94A3B8",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: 700, flexShrink: 0,
    }}>{initials}</div>
  );
}

function ConfirmModal({ user, onConfirm, onCancel }) {
  const isActive = user.status === "active";
  return (
<<<<<<< Updated upstream
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 50, backdropFilter: "blur(2px)",
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: "32px 36px",
        maxWidth: 420, width: "90%",
        boxShadow: "0 24px 64px rgba(15,23,42,0.18)", border: "1px solid #E2E8F0",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: isActive ? "#FEF2F2" : "#F0FDF4",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
        }}>
          <span style={{ fontSize: 20 }}>{isActive ? "⚠️" : "✅"}</span>
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#0F172A", fontFamily: "system-ui, sans-serif" }}>
          {isActive ? "Deactivate account?" : "Activate account?"}
        </h2>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "#475569", lineHeight: 1.6, fontFamily: "system-ui, sans-serif" }}>
          {isActive
            ? <><strong style={{ color: "#0F172A" }}>{user.fullname}</strong> will lose access immediately. Their data is preserved and the account can be reactivated later.</>
            : <><strong style={{ color: "#0F172A" }}>{user.fullname}</strong> will regain full access to the platform.</>
          }
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #E2E8F0",
            background: "#fff", color: "#374151", fontWeight: 600, fontSize: 14,
            cursor: "pointer", fontFamily: "system-ui, sans-serif",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
            background: isActive ? "#DC2626" : "#166534",
            color: "#fff", fontWeight: 600, fontSize: 14,
            cursor: "pointer", fontFamily: "system-ui, sans-serif",
          }}>
=======
    <div className="user-management-modal-overlay">
      <GlassPanel className="user-management-modal">
        <div
          className={`user-management-modal-icon ${
            isActive
              ? "user-management-modal-icon--danger"
              : "user-management-modal-icon--success"
          }`}
        >
          {isActive ? icons.warning : icons.check}
        </div>

        <h2 className="user-management-modal-title">
          {isActive ? "Deactivate account?" : "Activate account?"}
        </h2>

        <p className="user-management-modal-text">
          {isActive ? (
            <>
              <strong style={{ color: P.text }}>{user.fullname}</strong> will lose access immediately.
              Their data is preserved and the account can be reactivated later.
            </>
          ) : (
            <>
              <strong style={{ color: P.text }}>{user.fullname}</strong> will regain full access to the platform.
            </>
          )}
        </p>

        <div className="user-management-modal-actions">
          <button type="button" onClick={onCancel} className="user-management-modal-cancel">
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`user-management-modal-confirm ${
              isActive
                ? "user-management-modal-confirm--danger"
                : "user-management-modal-confirm--success"
            }`}
          >
>>>>>>> Stashed changes
            {isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, type }) {
  return (
<<<<<<< Updated upstream
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 100,
      background: type === "success" ? "#0F172A" : "#DC2626",
      color: "#fff", padding: "12px 20px", borderRadius: 10,
      fontSize: 14, fontWeight: 500, fontFamily: "system-ui, sans-serif",
      boxShadow: "0 8px 32px rgba(15,23,42,0.22)",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <span>{type === "success" ? "✓" : "✗"}</span>
=======
    <div
      className={`user-management-toast ${
        type === "success"
          ? "user-management-toast--success"
          : "user-management-toast--error"
      }`}
    >
      <span className="user-management-toast-icon">
        {type === "success" ? icons.check : icons.x}
      </span>
>>>>>>> Stashed changes
      {message}
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const lastFetchedQuery = useRef(null);
  const requestId = useRef(0);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const loadUsers = useCallback(async (searchText) => {
    const normalizedSearch = searchText.trim();

    if (lastFetchedQuery.current === normalizedSearch) {
      return;
    }

    lastFetchedQuery.current = normalizedSearch;
    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;
    setLoading(true);

    try {
      const data = await fetchUsers(normalizedSearch);

      if (requestId.current === currentRequestId) {
        setUsers(data);
      }
    } catch {
      if (requestId.current === currentRequestId) {
        showToast("Failed to load users.", "error");
      }
    } finally {
      if (requestId.current === currentRequestId) {
        setLoading(false);
      }
    }
  }, [showToast]);

  useEffect(() => {
    loadUsers("");
  }, [loadUsers]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadUsers(query);
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [query, loadUsers]);

  const confirmToggle = useCallback(async () => {
    const { _id, fullname, status } = confirmTarget;
    setConfirmTarget(null);

    try {
      const updated = await toggleUserStatus(_id);
      setUsers(prev => prev.map(u => u._id === _id ? updated : u));
      const action = status === "active" ? "deactivated" : "activated";
      showToast(`${fullname} has been ${action}.`);
    } catch {
      showToast("Could not update user status.", "error");
    }
  }, [confirmTarget, showToast]);

  const filtered = users.filter(u => {
    return filterRole === "all" || u.role === filterRole;
  });

<<<<<<< Updated upstream
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ background: "#0F172A", padding: "0 32px", display: "flex", alignItems: "center", height: 60, gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 14 }}>⚙</span>
=======
  const roleCounts = {
    all: users.length,
    ...Object.fromEntries(
      ROLES.map((role) => [role, users.filter((user) => user.role === role).length])
    ),
  };

  const handleRoleFilterClick = (role) => {
    setFilterRole((prev) => (prev === role ? "all" : role));
  };

  const dockItems = [
    {
      icon: <VscHome size={26} />,
      label: "Home",
      active: false,
      onClick: () => {
        if (onTabChange) {
          onTabChange("overview");
        } else {
          navigate("/organizer/workflow");
        }
      },
    },
    {
      icon: <VscCalendar size={26} />,
      label: "Events",
      active: false,
      onClick: () => navigate("/organizer/events"),
    },
    {
      icon: <VscTrash size={26} />,
      label: "Deactivate users",
      active: true,
      onClick: () => {
        if (onTabChange) {
          onTabChange("users");
        }
      },
    },
    {
      icon: <VscPersonAdd size={26} />,
      label: "Create",
      active: false,
      onClick: () => navigate("/organizer/registerothers"),
    },
    {
      icon: <VscPerson size={26} />,
      label: "Profile",
      active: false,
      onClick: () => navigate("/profile"),
    },
  ];

  return (
    <div className="organizer-dashboard-page user-management-page">
      <AppHeader
        crumb="User Management"
        right={
          <div className="organizer-dashboard-pill">
            Organizer Dashboard
          </div>
        }
      />
      <div className="user-management-shell">
        <div className="user-management-header">
        <div className="user-management-header-row">
          <div className="organizer-page-heading" style={{ marginBottom: 0 }}>
            <p className="organizer-page-kicker">Admin Control</p>
            <h1 className="organizer-page-title">User Management</h1>
            <p className="organizer-page-desc">
              Search, inspect, activate, and deactivate platform accounts.
            </p>
>>>>>>> Stashed changes
          </div>
          <span style={{ color: "#F8FAFC", fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>PopEyez</span>
        </div>
        <span style={{ color: "#475569", fontSize: 13, marginLeft: 4 }}>/ User Management</span>
      </div>

<<<<<<< Updated upstream
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em" }}>Users</h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748B" }}>Search, inspect, and manage platform accounts.</p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { label: "Total", value: users.length, color: "#0F172A" },
              { label: "Active", value: users.filter(u => u.status === "active").length, color: "#166534" },
              { label: "Inactive", value: users.filter(u => u.status === "inactive").length, color: "#991B1B" },
            ].map(stat => (
              <div key={stat.label} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: "12px 20px", textAlign: "center", minWidth: 72 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</div>
              </div>
=======
          <div className="user-management-stats">
            {[
              { label: "Total", value: users.length, color: P.text, delay: "0s" },
              {
                label: "Active",
                value: users.filter((user) => user.status === "active").length,
                color: "#4de7e3",
                delay: "0.05s",
              },
              {
                label: "Inactive",
                value: users.filter((user) => user.status === "inactive").length,
                color: "#ff5c86",
                delay: "0.1s",
              },
            ].map((stat) => (
              <GlassPanel
                key={stat.label}
                className="user-management-stat-card organizer-stat-tile organizer-card-in"
                style={{ "--stagger-delay": stat.delay }}
              >
                <div
                  className="user-management-stat-value"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </div>

                <div className="user-management-stat-label">
                  {stat.label}
                </div>
              </GlassPanel>
>>>>>>> Stashed changes
            ))}
          </div>
        </div>

<<<<<<< Updated upstream
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", fontSize: 16, pointerEvents: "none" }}>🔍</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or email..."
              style={{
                width: "100%", padding: "11px 14px 11px 40px", borderRadius: 9,
                border: "1px solid #E2E8F0", background: "#fff", fontSize: 14,
                color: "#0F172A", outline: "none", boxSizing: "border-box",
                boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
              }}
=======
        <GlassPanel className="user-management-search-panel">
          <div className="user-management-search-wrap">
            <span className="user-management-search-icon">{icons.search}</span>

            <input
              className="user-management-search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or email..."
>>>>>>> Stashed changes
            />
          </div>
          <div style={{ display: "flex", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 9, overflow: "hidden", boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}>
            {["all", ...ROLES].map(r => (
              <button key={r} onClick={() => setFilterRole(r)} style={{
                padding: "10px 16px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: filterRole === r ? "#0F172A" : "transparent",
                color: filterRole === r ? "#fff" : "#64748B",
                transition: "all 0.15s", whiteSpace: "nowrap",
              }}>
                {r === "all" ? "All" : r}
              </button>
            ))}
          </div>
        </div>

<<<<<<< Updated upstream
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 6px rgba(15,23,42,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["User", "Email", "Role", "Status", "Joined", "Action"].map(h => (
                  <th key={h} style={{ padding: "11px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: "48px 20px", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>Loading users...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: "48px 20px", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>No users match your search.</td></tr>
              ) : filtered.map((user, i) => {
                const isActive = user.status === "active";
                return (
                  <tr key={user._id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F1F5F9" : "none", background: "#fff" }}>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <Avatar fullname={user.fullname ?? ""} active={isActive} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                        {user.fullname || "Unnamed user"}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: "'SF Mono', 'Fira Code', monospace" }}>{user.email}</span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{
                        display: "inline-block", padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                        background: (ROLE_COLORS[user.role] ?? ROLE_COLORS.guest).bg,
                        color: (ROLE_COLORS[user.role] ?? ROLE_COLORS.guest).text,
                      }}>{user.role}</span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "4px 11px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                        background: isActive ? "#F0FDF4" : "#FEF2F2",
                        color: isActive ? "#166534" : "#991B1B",
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "#22C55E" : "#EF4444", display: "inline-block" }} />
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#64748B", whiteSpace: "nowrap" }}>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      {isActive ? (
                        <button
                          onClick={() => setConfirmTarget(user)}
                          style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid #FECACA", background: "#FFF5F5", color: "#DC2626", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#DC2626"; e.currentTarget.style.color = "#fff"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "#FFF5F5"; e.currentTarget.style.color = "#DC2626"; }}
                        >Deactivate</button>
                      ) : (
                        <button
                          onClick={() => setConfirmTarget(user)}
                          style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid #BBF7D0", background: "#F0FDF4", color: "#166534", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#166534"; e.currentTarget.style.color = "#fff"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "#F0FDF4"; e.currentTarget.style.color = "#166534"; }}
                        >Activate</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 14, fontSize: 13, color: "#94A3B8" }}>
=======
        {!loading && users.length > 0 && (
          <div className="role-filter-tiles">
            {ROLE_FILTER_ITEMS.map((item, index) => (
              <RoleFilterTile
                key={item.role}
                role={item.role}
                label={item.label}
                color={item.color}
                count={roleCounts[item.role] ?? 0}
                filterRole={filterRole}
                onSelect={handleRoleFilterClick}
                index={index}
              />
            ))}
          </div>
        )}
        </div>

        <div className="user-management-list">
          <GlassPanel className="user-management-table-panel" style={{ overflow: "hidden" }}>
            <div className="user-management-table-wrap">
            <table className="user-management-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr>
                  {["User", "Email", "Role", "Status", "Joined", "Action"].map((heading) => (
                    <th key={heading}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: "54px 20px",
                        textAlign: "center",
                        color: P.sub,
                        fontSize: 14,
                      }}
                    >
                      Loading users...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: "54px 20px",
                        textAlign: "center",
                        color: P.sub,
                        fontSize: 14,
                      }}
                    >
                      No users match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((user, index) => {
                    const isActive = user.status === "active";
                    const roleStyle = ROLE_COLORS[user.role] ?? DEFAULT_ROLE_STYLE;

                    return (
                      <tr
                        key={user._id}
                        style={{ "--row-delay": `${Math.min(index, 12) * 0.03}s` }}
                      >
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <Avatar fullname={user.fullname || user.fullName || ""} active={isActive} />

                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 850,
                                color: P.text,
                              }}
                            >
                              {user.fullname || user.fullName || "Unnamed user"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span
                            style={{
                              fontSize: 12,
                              color: P.sub,
                              fontFamily: "'SF Mono', 'Fira Code', monospace",
                            }}
                          >
                            {user.email}
                          </span>
                        </td>

                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "5px 11px",
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 850,
                              background: roleStyle.bg,
                              color: roleStyle.text,
                              border: `1px solid ${roleStyle.border}`,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {ROLE_LABELS[user.role] ?? user.role?.replace("_", " ")}
                          </span>
                        </td>

                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 7,
                              padding: "5px 12px",
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 850,
                              background: isActive
                                ? "rgba(77, 231, 227, 0.12)"
                                : "rgba(255, 82, 120, 0.12)",
                              color: isActive ? "#4de7e3" : "#ff5c86",
                              border: isActive
                                ? "1px solid rgba(77, 231, 227, 0.28)"
                                : "1px solid rgba(255, 82, 120, 0.28)",
                            }}
                          >
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                background: isActive ? "#4de7e3" : "#ff5c86",
                                display: "inline-block",
                                boxShadow: isActive
                                  ? "0 0 8px rgba(77,231,227,0.5)"
                                  : "0 0 8px rgba(255,82,120,0.5)",
                              }}
                            />
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td
                          style={{
                            fontSize: 13,
                            color: P.sub,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </td>

                        <td>
                          <button
                            type="button"
                            onClick={() => setConfirmTarget(user)}
                            className={`user-management-action-btn ${
                              isActive
                                ? "user-management-action-btn--deactivate"
                                : "user-management-action-btn--activate"
                            }`}
                          >
                            {isActive ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </GlassPanel>

        <div className="user-management-footer">
>>>>>>> Stashed changes
          Showing {filtered.length} of {users.length} users
        </div>
        </div>
      </div>

      {confirmTarget && (
        <ConfirmModal
          user={confirmTarget}
          onConfirm={confirmToggle}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
