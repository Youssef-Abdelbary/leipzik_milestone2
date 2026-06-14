import React, { useState, useEffect } from "react";
import { fetchNotifications, markNotificationAsRead } from "../services/serviceNotifications";

// TODO: replace with the actual logged-in user's id (e.g. from auth context)
const CURRENT_USER_ID = "665000000000000000000006";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications(CURRENT_USER_ID)
      .then((data) => {
        setNotifications(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, status: "read" } : n))
    );

    markNotificationAsRead(id).catch(() => {});
  };

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ background: "#0F172A", padding: "0 32px", display: "flex", alignItems: "center", height: 60, gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 14 }}>⚙</span>
          </div>
          <span style={{ color: "#F8FAFC", fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>PopEyez</span>
        </div>
        <span style={{ color: "#475569", fontSize: 13, marginLeft: 4 }}>/ Notifications</span>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "36px 24px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em" }}>Notifications</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748B" }}>
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up."}
          </p>
        </div>

        {loading ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>No notifications yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {notifications.map((n) => {
              const isUnread = n.status === "unread";
              return (
                <div
                  key={n._id}
                  onClick={() => isUnread && handleMarkAsRead(n._id)}
                  style={{
                    background: "#fff",
                    border: "1px solid #E2E8F0",
                    borderLeft: isUnread ? "4px solid #3B82F6" : "4px solid #E2E8F0",
                    borderRadius: 10,
                    padding: "14px 18px",
                    boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
                    cursor: isUnread ? "pointer" : "default",
                    opacity: isUnread ? 1 : 0.7,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{n.title}</div>
                    {isUnread && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#3B82F6", background: "#EFF6FF", padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap" }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 8 }}>
                    {n.scheduledFor ? new Date(n.scheduledFor).toLocaleString() : new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}