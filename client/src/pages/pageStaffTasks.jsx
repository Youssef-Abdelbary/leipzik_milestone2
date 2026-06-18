import { useEffect, useState } from "react";
import "./pageStaffTasks.css";
import "../components/componentTheme.css";
import { useNavigate } from "react-router-dom";
import TabStaffDayOf from "./tabs/TabStaffDayOf";
import StaffSharedLayout from "./StaffSharedLayout";

import Dock from "../components/componentDock";
import AppHeader from "../components/componentAppHeader";
import { icons } from "../components/componentTheme";
import { VscHome, VscCalendar, VscPerson, VscLayout } from "react-icons/vsc";
import { FaQrcode } from "react-icons/fa";
import { fetchNotifications, markNotificationAsRead } from "../services/serviceNotifications";

const STAFF_TABS = [
  { id: "tasks", label: "Tasks", icon: <VscHome size={26} /> },
  { id: "layout", label: "Layout", icon: <VscLayout size={26} /> },
  { id: "dayof", label: "Day-Of", icon: <VscCalendar size={26} /> },
  { id: "qr", label: "QR Scan", icon: <FaQrcode size={26} /> },
  { id: "profile", label: "Profile", icon: <VscPerson size={26} /> },
];

function DockTabIcon({ icon }) {
  return (
    <div style={{ transform: "scale(1.25)", display: "flex" }}>
      {icon}
    </div>
  );
}

export default function StaffTasks() {
  const [activeTab, setActiveTab] = useState("tasks");
  const [staffId, setStaffId] = useState("");
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedEventTitle, setSelectedEventTitle] = useState("");
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser =
      JSON.parse(localStorage.getItem("loggedInUser")) ||
      JSON.parse(localStorage.getItem("user"));

    console.log("Logged in staff user:", loggedInUser);

    if (!loggedInUser?._id && !loggedInUser?.id) {
      console.warn("No logged-in staff found in localStorage.");
      return;
    }

    setStaffId(loggedInUser._id || loggedInUser.id);
  }, []);

  useEffect(() => {
    if (!staffId) return;

    loadAllStaffEvents();
    loadAllStaffTasks();
    fetchNotifications(staffId).then((data) =>
      setNotifications(data.data || data || [])
    );
  }, [staffId]);

  useEffect(() => {
    if (!staffId) return;

    loadStaffEvents();
  }, [staffId, selectedDate]);

  useEffect(() => {
    if (!staffId) return;

    loadStaffTasks();
  }, [staffId, selectedStatus, selectedEventId]);

  async function loadAllStaffEvents() {
    const response = await fetch(
      `http://localhost:5001/api/staff-tasks/events/${staffId}`
    );

    const data = await response.json();
    setAllEvents(data);
  }

  async function loadStaffEvents() {
    const query = selectedDate ? `?date=${selectedDate}` : "";

    const response = await fetch(
      `http://localhost:5001/api/staff-tasks/events/${staffId}${query}`
    );

    const data = await response.json();
    setEvents(data);
  }

  async function loadAllStaffTasks() {
    const response = await fetch(
      `http://localhost:5001/api/staff-tasks/tasks/${staffId}`
    );

    const data = await response.json();
    setAllTasks(data);
  }

  async function loadStaffTasks() {
    const params = new URLSearchParams();

    if (selectedStatus) {
      params.append("status", selectedStatus);
    }

    if (selectedEventId) {
      params.append("eventId", selectedEventId);
    }

    const query = params.toString() ? `?${params.toString()}` : "";

    const response = await fetch(
      `http://localhost:5001/api/staff-tasks/tasks/${staffId}${query}`
    );

    const data = await response.json();
    setTasks(data);
  }

  async function updateTaskProgress(taskId, status, progressPercent) {
    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:5001/api/staff-tasks/tasks/${taskId}/progress`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            progressPercent: Number(progressPercent),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to update task");
        return;
      }

      loadAllStaffEvents();
      loadAllStaffTasks();
      loadStaffEvents();
      loadStaffTasks();
    } catch (error) {
      console.error("Update task error:", error);
      alert("Something went wrong while updating the task.");
    } finally {
      setLoading(false);
    }
  }

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, status: "read" } : n))
    );
    markNotificationAsRead(id).catch(() => {});
  };

  const totalEvents = allEvents.length;
  const totalTasks = allTasks.length;

  const pendingTasks = allTasks.filter(
    (task) => task.status === "pending"
  ).length;

  const doneTasks = allTasks.filter(
    (task) => task.status === "done"
  ).length;

  const dockItems = STAFF_TABS.map((tab) => ({
    icon: tab.icon,
    label: tab.label,
    active: activeTab === tab.id,
    onClick: () => {
      if (tab.id === "profile") {
        navigate("/profile");
        return;
      }

      if (tab.id === "qr") {
        navigate("/staff/qr-scanner");
        return;
      }

      setActiveTab(tab.id);
    },
  }));

  return (
    <div className="staff-workspace-page">
      <AppHeader
        crumb={
          activeTab === "tasks"
            ? "My Tasks"
            : activeTab === "layout"
              ? "My Layouts"
              : "Day-Of"
        }
        right={
          <div className="staff-dashboard-pill">
            Staff Dashboard
          </div>
        }
      />
      <div className="staff-tab-content">
        {activeTab === "tasks" && (
          <>
            <div className="staff-page-header">
              <div>
                <h1>Staff Operations Dashboard</h1>
                <p>Track your assigned events and update operational task progress.</p>
              </div>
            </div>

            <div className="staff-summary-cards">
              <div className="staff-summary-card">
                <h3>Participating Events</h3>
                <p>{totalEvents}</p>
              </div>

              <div className="staff-summary-card">
                <h3>Assigned Tasks</h3>
                <p>{totalTasks}</p>
              </div>

              <div className="staff-summary-card">
                <h3>Pending Tasks</h3>
                <p>{pendingTasks}</p>
              </div>

              <div className="staff-summary-card">
                <h3>Done Tasks</h3>
                <p>{doneTasks}</p>
              </div>
            </div>

            <section className="staff-section">
              <div className="staff-section-header">
                <div>
                  <h2>Participating Events</h2>
                  <p>Events where you have assigned tasks.</p>
                </div>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
              </div>

              <div className="staff-list">
                {events.length === 0 && (
                  <p className="staff-empty">No events found.</p>
                )}

                {events.map((event) => {
                  const isSelected = selectedEventId === event._id;

                  return (
                    <div
                      className={
                        isSelected
                          ? "staff-event-card selected-event-card expanded-event-card"
                          : "staff-event-card"
                      }
                      key={event._id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedEventId("");
                          setSelectedEventTitle("");
                        } else {
                          setSelectedEventId(event._id);
                          setSelectedEventTitle(event.title);
                        }
                      }}
                    >
                      <div className="staff-event-main-row">
                        <div>
                          <h3>{event.title}</h3>
                          <p>
                            📅{" "}
                            {event.date
                              ? new Date(event.date).toDateString()
                              : "No date"}
                          </p>
                        </div>

                        <div className="staff-event-right">
                          <span className="staff-status-badge">{event.status}</span>
                          <span className="event-expand-arrow">{isSelected ? "▲" : "▼"}</span>
                        </div>
                      </div>

                      {isSelected && (
                        <div
                          className="event-expanded-tasks"
                          onClick={(clickEvent) => clickEvent.stopPropagation()}
                        >
                          <div className="staff-section-header compact-task-header">
                            <div>
                              <h2>Assigned Operational Tasks</h2>
                              <p>Tasks assigned to you for this event.</p>
                            </div>

                            <select
                              value={selectedStatus}
                              onChange={(event) => setSelectedStatus(event.target.value)}
                            >
                              <option value="">All statuses</option>
                              <option value="pending">Pending</option>
                              <option value="in_progress">In progress</option>
                              <option value="done">Done</option>
                            </select>
                          </div>

                          <div className="staff-list">
                            {tasks.length === 0 && (
                              <p className="staff-empty">No tasks found for this event.</p>
                            )}

                            {tasks.map((task) => (
                              <div className="staff-task-card" key={task._id}>
                                <div className="staff-task-top">
                                  <div>
                                    <h3>{task.title}</h3>
                                    <p>{task.description}</p>
                                  </div>

                                  <span className={`staff-task-status ${task.status}`}>
                                    {task.status}
                                  </span>
                                </div>

                                <div className="staff-task-meta">
                                  <span>Category: {task.category}</span>
                                  <span>Priority: {task.priority}</span>
                                </div>

                                <div className="staff-progress-row">
                                  <span>Progress</span>
                                  <strong>{task.progressPercent || 0}%</strong>
                                </div>

                                <div className="staff-progress-bar">
                                  <div
                                    className="staff-progress-fill"
                                    style={{ width: `${task.progressPercent || 0}%` }}
                                  ></div>
                                </div>

                                {task.status === "in_progress" && (
                                  <div className="staff-progress-actions">
                                    <button
                                      onClick={() =>
                                        updateTaskProgress(task._id, "in_progress", 25)
                                      }
                                      disabled={loading}
                                    >
                                      25%
                                    </button>

                                    <button
                                      onClick={() =>
                                        updateTaskProgress(task._id, "in_progress", 50)
                                      }
                                      disabled={loading}
                                    >
                                      50%
                                    </button>

                                    <button
                                      onClick={() =>
                                        updateTaskProgress(task._id, "in_progress", 75)
                                      }
                                      disabled={loading}
                                    >
                                      75%
                                    </button>

                                    <button
                                      onClick={() =>
                                        updateTaskProgress(task._id, "done", 100)
                                      }
                                      disabled={loading}
                                    >
                                      100%
                                    </button>
                                  </div>
                                )}

                                {task.status !== "done" && (
                                  <div className="staff-task-actions">
                                    {task.status === "pending" && (
                                      <button
                                        onClick={() =>
                                          updateTaskProgress(task._id, "in_progress", 0)
                                        }
                                        disabled={loading}
                                      >
                                        Start Task
                                      </button>
                                    )}

                                    <button
                                      onClick={() =>
                                        updateTaskProgress(task._id, "done", 100)
                                      }
                                      disabled={loading}
                                    >
                                      Mark Done
                                    </button>
                                  </div>
                                )}

                                {task.status === "done" && (
                                  <p className="staff-done-note">Task completed.</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Notifications */}
            <section className="staff-section">
              <div className="staff-section-header">
                <div>
                  <h2>🔔 Notifications</h2>
                  <p>
                    {notifications.filter((n) => n.status === "unread").length > 0
                      ? `${notifications.filter((n) => n.status === "unread").length} unread`
                      : "You're all caught up."}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {notifications.length === 0 ? (
                  <p className="staff-empty">No notifications to show yet.</p>
                ) : (
                  notifications.map((n) => {
                    const isUnread = n.status === "unread";
                    return (
                      <div
                        key={n._id || n.id}
                        onClick={() => isUnread && handleMarkAsRead(n._id)}
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderLeft: isUnread
                            ? "4px solid #7C5CFC"
                            : "4px solid rgba(255,255,255,0.08)",
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
                          {n.scheduledFor
                            ? new Date(n.scheduledFor).toLocaleString()
                            : new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === "layout" && (
          <StaffSharedLayout />
        )}
        {activeTab === "dayof" && <TabStaffDayOf />}

        {!["tasks", "layout", "dayof"].includes(activeTab) && (
          <div className="staff-coming-soon">
            <p>🚧</p>
            <h2>
              {STAFF_TABS.find((tab) => tab.id === activeTab)?.label.replace(
                /^\S+\s/,
                ""
              )}{" "}
              — coming soon
            </h2>
          </div>
        )}
      </div>
      <Dock items={dockItems} />
    </div>
  );
}