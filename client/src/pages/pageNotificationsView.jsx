import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { VscHome, VscMail, VscCalendar, VscBell, VscPerson } from "react-icons/vsc";
import Dock from "../components/componentDock.jsx";
import AppHeader from "../components/componentAppHeader.jsx";
import { fetchNotifications, markNotificationAsRead } from "../services/serviceNotifications";

// TODO: replace with the actual logged-in user's id (e.g. from auth context)
const CURRENT_USER_ID = "665000000000000000000006";

export default function NotificationsPage() {
  const navigate = useNavigate();
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

  const dockItems = [
    { icon: <VscMail size={26} />, label: 'Requests', onClick: () => navigate('/venueowner/venueresponse') },
    { icon: <VscBell size={26} />, label: 'Notifications', active: true, onClick: () => navigate('/notificationsview') },
    { icon: <VscHome size={26} />, label: 'Home', onClick: () => navigate('/venueowner/venues') },
    { icon: <VscCalendar size={26} />, label: 'Reports', onClick: () => navigate('/venueowner/venuereports') },
    { icon: <VscPerson size={26} />, label: 'Owner Profile', onClick: () => navigate('/pageProfile') },
  ];

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, status: "read" } : n))
    );

    markNotificationAsRead(id).catch(() => { });
  };

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a12", color: "#E8E6F0", fontFamily: "system-ui, -apple-system, sans-serif", padding: "24px 24px 140px" }}>
      <AppHeader
        crumb="Notifications"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: 'rgba(62,207,184,0.14)', color: '#3ecfb8', border: '1px solid rgba(62,207,184,0.27)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3ecfb8', display: 'inline-block', boxShadow: '0 0 6px rgba(62,207,184,0.4)' }} />
            Venue Owner Portal
          </div>
        }
      />
      <div style={{ maxWidth: 900, margin: "0 auto", paddingTop: 12 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#F8FAFC", letterSpacing: "-0.03em" }}>Notifications</h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "rgba(232,230,240,0.68)" }}>
            {notifications.filter((n) => n.status === "unread").length > 0
              ? `${notifications.filter((n) => n.status === "unread").length} unread`
              : "You're all caught up."}
          </p>
        </div>

        {loading ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "rgba(232,230,240,0.5)", fontSize: 14 }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "rgba(232,230,240,0.5)", fontSize: 14 }}>No notifications yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {notifications.map((n) => {
              const isUnread = n.status === "unread";
              return (
                <div
                  key={n._id}
                  onClick={() => isUnread && handleMarkAsRead(n._id)}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderLeft: isUnread ? "4px solid #7C5CFC" : "4px solid rgba(255,255,255,0.08)",
                    borderRadius: 16,
                    padding: "18px 20px",
                    boxShadow: "0 14px 40px rgba(0,0,0,0.18)",
                    cursor: isUnread ? "pointer" : "default",
                    opacity: isUnread ? 1 : 0.75,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#F8FAFC" }}>{n.title}</div>
                    {isUnread && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", background: "rgba(167,139,250,0.18)", padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(232,230,240,0.7)", marginTop: 8 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: "rgba(232,230,240,0.45)", marginTop: 10 }}>
                    {n.scheduledFor ? new Date(n.scheduledFor).toLocaleString() : new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dock items={dockItems} />
    </div>
  );
}