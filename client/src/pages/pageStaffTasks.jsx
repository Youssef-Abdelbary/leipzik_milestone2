import { useEffect, useState } from "react";
import "./pageStaffTasks.css";
import "../components/componentTheme.css";
import { useNavigate, useLocation } from "react-router-dom";
import TabStaffDayOf from "./tabs/TabStaffDayOf";
import TabStaffGuests from "./tabs/TabStaffGuests";
import StaffSharedLayout from "./StaffSharedLayout";
import { OpalSelect } from "../components/componentMenus";
import Dock from "../components/componentDock";
import AppHeader from "../components/componentAppHeader";
import { icons } from "../components/componentTheme";
import { buildStaffDockItems, getStaffTabLabel } from "../utils/staffNav";
import { fetchNotifications, markNotificationAsRead } from "../services/serviceNotifications";
import {
  fetchStaffEvents,
  fetchStaffTasks,
  updateStaffTaskProgress,
} from "../services/serviceStaffTasks";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

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
  const location = useLocation();

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state?.activeTab]);

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
    const data = await fetchStaffEvents(staffId);
    setAllEvents(data);
  }

  async function loadStaffEvents() {
    const data = await fetchStaffEvents(staffId, selectedDate || undefined);
    setEvents(data);
  }

  async function loadAllStaffTasks() {
    const data = await fetchStaffTasks(staffId);
    setAllTasks(data);
  }

  async function loadStaffTasks() {
    const data = await fetchStaffTasks(staffId, {
      status: selectedStatus || undefined,
      eventId: selectedEventId || undefined,
    });
    setTasks(data);
  }

  async function updateTaskProgress(taskId, status, progressPercent) {
    try {
      setLoading(true);

      const data = await updateStaffTaskProgress(taskId, {
        status,
        progressPercent: Number(progressPercent),
      });

      if (data.message) {
        alert(data.message);
      }

      loadAllStaffEvents();
      loadAllStaffTasks();
      loadStaffEvents();
      loadStaffTasks();
    } catch (error) {
      console.error("Update task error:", error);
      alert(error.message || "Something went wrong while updating the task.");
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

  const dockItems = buildStaffDockItems(navigate, activeTab);

  const tabCrumb = getStaffTabLabel(activeTab);

  return (
    <div className="staff-workspace-page">
      <AppHeader
        crumb={tabCrumb}
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
                  className="staff-date-filter"
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
                          <p className="staff-event-date">
                            {icons.calendar}{" "}
                            {event.date
                              ? new Date(event.date).toDateString()
                              : "No date"}
                          </p>
                        </div>

                        <div className="staff-event-right">
                          <span className="staff-status-badge">{event.status}</span>
                          <span className={`event-expand-arrow ${isSelected ? "expanded" : ""}`}>
                            {isSelected ? icons.chevronUp : icons.chevronDown}
                          </span>
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

                            <OpalSelect
                              value={selectedStatus}
                              onChange={setSelectedStatus}
                              options={STATUS_OPTIONS}
                              placeholder="Filter status"
                              accent="teal"
                            />
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
                  <h2>{icons.bell} Notifications</h2>
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
        {activeTab === "guests" && <TabStaffGuests />}
      </div>
      <Dock items={dockItems} />
    </div>
  );
}