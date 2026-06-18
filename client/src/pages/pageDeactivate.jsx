import { useState, useEffect, useRef, useCallback } from "react";
import { fetchUsers, toggleUserStatus } from "../services/serviceDeactivate";
import "../components/componentTheme.css";
import { P, GlassPanel } from "../components/componentTheme";
import { VscHome, VscCalendar, VscPerson, VscAccount, VscPersonAdd, VscTrash} from "react-icons/vsc";
import Dock from "../components/componentDock";
import { useNavigate } from "react-router-dom";
import "./pageDeactivate.css";
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

const ROLES = Object.keys(ROLE_COLORS);

function Avatar({ fullname = "", active }) {
  const initials = fullname
    ? fullname
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: active
          ? "linear-gradient(135deg, rgba(139,109,255,0.9), rgba(77,231,227,0.9))"
          : "rgba(255,255,255,0.06)",
        color: active ? "#071018" : P.sub,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 900,
        flexShrink: 0,
        border: active
          ? "1px solid rgba(255,255,255,0.18)"
          : "1px solid rgba(255,255,255,0.1)",
        boxShadow: active
          ? "0 0 20px rgba(77,231,227,0.16)"
          : "none",
      }}
    >
      {initials}
    </div>
  );
}

function ConfirmModal({ user, onConfirm, onCancel }) {
  const isActive = user.status === "active";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5, 5, 10, 0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        backdropFilter: "blur(8px)",
      }}
    >
      <GlassPanel
        style={{
          maxWidth: 440,
          width: "90%",
          padding: "30px 34px",
          background: "rgba(18, 18, 29, 0.92)",
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: isActive
              ? "rgba(255, 82, 120, 0.12)"
              : "rgba(77, 231, 227, 0.12)",
            color: isActive ? "#ff5c86" : "#4de7e3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            border: isActive
              ? "1px solid rgba(255, 82, 120, 0.3)"
              : "1px solid rgba(77, 231, 227, 0.3)",
          }}
        >
          <span style={{ fontSize: 20 }}>{isActive ? "⚠️" : "✅"}</span>
        </div>

        <h2
          style={{
            margin: "0 0 8px",
            fontSize: 20,
            fontWeight: 900,
            color: P.text,
            fontFamily: "var(--font-display), system-ui, sans-serif",
            letterSpacing: "-0.03em",
          }}
        >
          {isActive ? "Deactivate account?" : "Activate account?"}
        </h2>

        <p
          style={{
            margin: "0 0 26px",
            fontSize: 14,
            color: P.sub,
            lineHeight: 1.65,
          }}
        >
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

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 11,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              color: P.text,
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 11,
              border: "none",
              background: isActive
                ? "linear-gradient(135deg, #ff5278, #ff7a9a)"
                : "linear-gradient(135deg, #4de7e3, #8b6dff)",
              color: isActive ? "#fff" : "#071018",
              fontWeight: 900,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}

function Toast({ message, type }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 100,
        background: type === "success"
          ? "rgba(18, 18, 29, 0.96)"
          : "rgba(255, 82, 120, 0.95)",
        color: "#fff",
        padding: "13px 20px",
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 800,
        boxShadow: "0 12px 36px rgba(0,0,0,0.35)",
        border: type === "success"
          ? "1px solid rgba(77,231,227,0.26)"
          : "1px solid rgba(255,255,255,0.12)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span>{type === "success" ? "✓" : "✗"}</span>
      {message}
    </div>
  );
}

export default function UserManagement({ onTabChange }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const lastFetchedQuery = useRef(null);
  const requestId = useRef(0);
  const navigate = useNavigate();

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const loadUsers = useCallback(
    async (searchText) => {
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
    },
    [showToast]
  );

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
      setUsers((prev) => prev.map((user) => (user._id === _id ? updated : user)));

      const action = status === "active" ? "deactivated" : "activated";
      showToast(`${fullname} has been ${action}.`);
    } catch {
      showToast("Could not update user status.", "error");
    }
  }, [confirmTarget, showToast]);

  const filtered = users.filter((user) => {
    return filterRole === "all" || user.role === filterRole;
  });

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
    <div
      style={{
        minHeight: "100vh",
        background: P.bg,
        color: P.text,
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        padding: "34px 24px 50px",
      }}
    >
      <AppHeader
              crumb="Other users in app"
              right={
                <div className="organizer-dashboard-pill">
                  Organizer Dashboard
                </div>
              }
            />
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 18,
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 8px",
                color: P.teal,
                fontSize: 12,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Admin Control
            </p>

            <h1
              style={{
                margin: 0,
                fontSize: 34,
                fontWeight: 950,
                color: P.text,
                letterSpacing: "-0.05em",
                fontFamily: "var(--font-display), system-ui, sans-serif",
              }}
            >
              User Management
            </h1>

            <p
              style={{
                margin: "7px 0 0",
                fontSize: 14,
                color: P.sub,
                maxWidth: 620,
              }}
            >
              Search, inspect, activate, and deactivate platform accounts.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { label: "Total", value: users.length, color: P.text },
              {
                label: "Active",
                value: users.filter((user) => user.status === "active").length,
                color: "#4de7e3",
              },
              {
                label: "Inactive",
                value: users.filter((user) => user.status === "inactive").length,
                color: "#ff5c86",
              },
            ].map((stat) => (
              <GlassPanel
                key={stat.label}
                style={{
                  padding: "14px 22px",
                  textAlign: "center",
                  minWidth: 88,
                }}
              >
                <div
                  style={{
                    fontSize: 25,
                    fontWeight: 950,
                    color: stat.color,
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: P.sub,
                    marginTop: 5,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {stat.label}
                </div>
              </GlassPanel>
            ))}
          </div>
        </div>

        <GlassPanel style={{ padding: 18, marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 15,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: P.sub,
                  fontSize: 16,
                  pointerEvents: "none",
                }}
              >
                🔍
              </span>

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or email..."
                style={{
                  width: "100%",
                  padding: "13px 15px 13px 43px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)",
                  fontSize: 14,
                  color: P.text,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                overflow: "hidden",
                flexWrap: "wrap",
              }}
            >
              {["all", ...ROLES].map((role) => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  style={{
                    padding: "12px 16px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 850,
                    background:
                      filterRole === role
                        ? "linear-gradient(135deg, #8b6dff, #4de7e3)"
                        : "transparent",
                    color: filterRole === role ? "#071018" : P.sub,
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                    fontFamily: "inherit",
                  }}
                >
                  {role === "all" ? "All" : role.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </GlassPanel>

        <GlassPanel style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr
                  style={{
                    background: "rgba(255,255,255,0.035)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {["User", "Email", "Role", "Status", "Joined", "Action"].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: "14px 20px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 900,
                        color: P.sub,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        whiteSpace: "nowrap",
                      }}
                    >
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
                        style={{
                          borderBottom:
                            index < filtered.length - 1
                              ? "1px solid rgba(255,255,255,0.06)"
                              : "none",
                          background: "rgba(255,255,255,0.015)",
                        }}
                      >
                        <td style={{ padding: "15px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <Avatar fullname={user.fullname || user.fullName || ""} active={isActive} />
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 850,
                                color: P.text,
                              }}
                            >
                              {user.fullname || user.fullName || "Unnamed user"}                            </span>
                          </div>
                        </td>

                        <td style={{ padding: "15px 20px" }}>
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

                        <td style={{ padding: "15px 20px" }}>
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
                            }}
                          >
                            {user.role?.replace("_", " ")}
                          </span>
                        </td>

                        <td style={{ padding: "15px 20px" }}>
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
                            padding: "15px 20px",
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

                        <td style={{ padding: "15px 20px" }}>
                          <button
                            onClick={() => setConfirmTarget(user)}
                            style={{
                              padding: "8px 15px",
                              borderRadius: 9,
                              border: isActive
                                ? "1px solid rgba(255,82,120,0.38)"
                                : "1px solid rgba(77,231,227,0.38)",
                              background: isActive
                                ? "rgba(255,82,120,0.1)"
                                : "rgba(77,231,227,0.1)",
                              color: isActive ? "#ff5c86" : "#4de7e3",
                              fontWeight: 850,
                              fontSize: 13,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              transition: "all 0.15s",
                              fontFamily: "inherit",
                            }}
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

        <div style={{ marginTop: 16, fontSize: 13, color: P.sub, fontWeight: 650 }}>
          Showing {filtered.length} of {users.length} users
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
      <Dock items={dockItems} />
    </div>
    
  );
}