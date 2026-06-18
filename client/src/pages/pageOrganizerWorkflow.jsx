import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./pageOrganizerWorkflow.css";
import "../components/componentTheme.css";
import AppHeader from "../components/componentAppHeader";
import { P, icons, GlassPanel } from "../components/componentTheme";
import Dock from "../components/componentDock";
import { VscHome, VscCalendar, VscPerson, VscAccount, VscPersonAdd, VscTrash} from "react-icons/vsc";
import UserManagement from "./pageDeactivate";
import RegisterForOthers from "./pageRegisterOthers";
import { fetchNotifications, markNotificationAsRead } from "../services/serviceNotifications";


function DockTabIcon({ icon }) {
  return (
    <div style={{ transform: "scale(1.25)", display: "flex" }}>
      {icon}
    </div>
  );
}

function OrganizerWorkflow() {
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  const [tasks, setTasks] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");

  const [showEvents, setShowEvents] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  const navigate = useNavigate();

  async function fetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      console.error("Failed URL:", url);
      console.error("Backend returned:", text);
      throw new Error(`Request failed: ${url}`);
    }

    return response.json();
  }

  useEffect(() => {
    async function loadWorkflowData() {
      try {
        const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

        if (!loggedInUser?._id && !loggedInUser?.id) {
          console.warn("No logged-in user found.");
          return;
        }

        const organizerId = loggedInUser._id || loggedInUser.id;

        console.log("Logged in user:", loggedInUser);
        console.log("Organizer ID sent to backend:", organizerId);

        const summaryData = await fetchJson(
          `http://localhost:5001/api/workflow/summary/${organizerId}`
        );
        setSummary(summaryData);

        const eventsData = await fetchJson(
          `http://localhost:5001/api/workflow/events/${organizerId}`
        );
        setEvents(eventsData);

        const tasksData = await fetchJson(
          `http://localhost:5001/api/workflow/tasks/${organizerId}`
        );
        setTasks(tasksData);

        fetchNotifications(organizerId).then((data) => setNotifications(data.data || data || []));
      } catch (error) {
        console.error("Failed to load workflow data:", error);
      }
    }

    loadWorkflowData();
  }, []);

  const filteredEvents = events.filter((event) => {
    if (!event.date) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDateObject = new Date(event.date);
    eventDateObject.setHours(0, 0, 0, 0);

    if (eventDateObject < today) {
      return false;
    }

    if (selectedDate === "") {
      return true;
    }

    const eventDate = eventDateObject.toISOString().split("T")[0];

    return eventDate === selectedDate;
  });

  function getTaskEvent(task) {
    const taskEventId = task.eventId?._id || task.eventId;

    return events.find((event) => event._id === taskEventId);
  }

  const filteredTasks = tasks.filter((task) => {
    const taskEvent = getTaskEvent(task);

    if (!taskEvent?.date) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDate = new Date(taskEvent.date);
    eventDate.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      return false;
    }

    if (selectedStatus === "") {
      return true;
    }

    return task.status === selectedStatus;
  });

  const now = new Date();

  const reminderTasks = tasks.filter((task) => {
    if (task.status === "done") {
      return false;
    }

    if (!task.dueDate) {
      return false;
    }

    const taskEvent = getTaskEvent(task);

    if (!taskEvent?.date) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDate = new Date(taskEvent.date);
    eventDate.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      return false;
    }

    return true;
  });

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, status: "read" } : n))
    );
    markNotificationAsRead(id).catch(() => {});
  };

  const dockItems = [
    {
      icon: <VscHome size={26} />,
      label: "Home",
      active: true,
      onClick: () => navigate("/organizer/workflow"),
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
      active: false,
      onClick: () => navigate("/organizer/deactivate"),
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
    <div className="workflow-page">
      <AppHeader
        crumb="My Workflow"
        right={
          <div className="organizer-dashboard-pill">
            Organizer Dashboard
          </div>
        }
      />
      <main className="workflow-content">

        <div className="summary-cards">
          <WorkflowStatCard
            label="Today's Events"
            value={summary ? summary.todayEventsCount : "Loading..."}
            icon={icons.calendar || "📅"}
            accent="cyan"
          />

          <WorkflowStatCard
            label="Upcoming Events"
            value={summary ? summary.upcomingEventsCount : "Loading..."}
            icon={icons.clock || "⏳"}
            accent="blue"
          />

          <WorkflowStatCard
            label="Avg Positive Feedback"
            value={
              summary ? summary.averagePositiveFeedback.toFixed(2) : "Loading..."
            }
            icon={icons.feedback || "😊"}
            accent="teal"
          />

          <WorkflowStatCard
            label="Avg Negative Feedback"
            value={
              summary ? summary.averageNegativeFeedback.toFixed(2) : "Loading..."
            }
            icon={icons.warning || "⚠️"}
            accent="orange"
          />
        </div>

        <GlassPanel className="workflow-section">
          <div className="section-header">
            <div>
              <h2
                className="collapsible-title"
                onClick={() => setShowEvents(!showEvents)}
              >
                {icons.calendar || "📅"} Upcoming Events{" "}
                <span>{showEvents ? "▲" : "▼"}</span>
              </h2>
              <p>View and filter upcoming events by date.</p>
            </div>

            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>

          {showEvents && (
            <div className="events-list">
              {filteredEvents.length === 0 && (
                <p className="empty-message">No events found for this date.</p>
              )}

              {filteredEvents.map((event) => (
                <div className="event-card" key={event._id}>
                  <div>
                    <h3>{event.title}</h3>
                    <p>
                      {icons.mapPin || "📍"}{" "}
                      {event.locationSnapshot?.venueName || "TBD"} —{" "}
                      {event.locationSnapshot?.city || "TBD"}
                    </p>
                  </div>

                  <div className="event-info">
                    <span>
                      {event.date
                        ? new Date(event.date).toLocaleDateString()
                        : "No date"}
                    </span>
                    <span>{event.startTime || "No time"}</span>
                    <span className="event-status">
                      {event.status || "planning"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>

        <GlassPanel className="workflow-section">
          <div className="section-header">
            <div>
              <h2
                className="collapsible-title"
                onClick={() => setShowTasks(!showTasks)}
              >
                {icons.check || "✅"} Event Tasks{" "}
                <span>{showTasks ? "▲" : "▼"}</span>
              </h2>
              <p>Track tasks leading up to each event and filter them by status.</p>
            </div>

            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="not_assigned">Not Assigned</option>
            </select>
          </div>

          {showTasks && (
            <div className="tasks-list">
              {filteredTasks.length === 0 && (
                <p className="empty-message">No tasks found for this status.</p>
              )}

              {filteredTasks.map((task) => {
                const taskEvent = getTaskEvent(task);

                return (
                  <div className="task-card" key={task._id}>
                    <div>
                      <h3>{task.title}</h3>
                      <p>{task.description}</p>

                      <p className="task-category">
                        {icons.tag || "📌"} {task.category}
                      </p>

                      <p className="task-event-name">
                        {icons.calendar || "🗓️"} Event:{" "}
                        {taskEvent?.title || task.eventTitle || "Unknown event"}
                      </p>
                    </div>

                    <div className="task-info">
                      <span className={`task-status ${task.status}`}>
                        {task.status.replace("_", " ")}
                      </span>

                      <span>🔥 {task.priority}</span>

                      <span>
                        {icons.calendar || "📅"}{" "}
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString()
                          : "No due date"}
                      </span>

                      <span>📊 {task.progressPercent || 0}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassPanel>

        <GlassPanel className="workflow-section reminders-section">
          <div className="section-header simple">
            <div>
              <h2>{icons.warning || "🔔"} Due Task Reminders</h2>
              <p>Tasks that still need attention before upcoming events.</p>
            </div>
          </div>

          <div className="reminders-list">
            {reminderTasks.length === 0 && (
              <p className="empty-message">No due task reminders right now.</p>
            )}

            {reminderTasks.map((task) => {
              const taskEvent = getTaskEvent(task);
              const dueDate = new Date(task.dueDate);
              const isOverdue = dueDate < now;

              return (
                <div
                  className={
                    isOverdue
                      ? "reminder-card overdue-reminder-card"
                      : "reminder-card"
                  }
                  key={task._id}
                >
                  <div>
                    <h3>
                      {isOverdue ? "🚨" : "⚠️"} {task.title}
                    </h3>
                    <p>{task.description}</p>

                    <p className="task-event-name">
                      {icons.calendar || "🗓️"} Event:{" "}
                      {taskEvent?.title || task.eventTitle || "Unknown event"}
                    </p>

                    {isOverdue && (
                      <p className="overdue-text">Deadline has passed</p>
                    )}
                  </div>

                  <div className="reminder-info">
                    <span>Due: {dueDate.toLocaleDateString()}</span>

                    <span>
                      {dueDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    <span>🔥 {task.priority}</span>

                    <span
                      className={isOverdue ? "overdue-badge" : "upcoming-badge"}
                    >
                      {isOverdue ? "Overdue" : "Upcoming"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassPanel>

        <GlassPanel className="workflow-section notifications-section">
          <div className="section-header simple">
            <div>
              <h2>{icons.messages || "🔔"} Notifications</h2>
              <p>
                {notifications.filter((n) => n.status === "unread").length > 0
                  ? `${notifications.filter((n) => n.status === "unread").length} unread`
                  : "You're all caught up."}
              </p>
            </div>
          </div>

          <div className="notifications-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {notifications.length === 0 ? (
              <p className="empty-message">No notifications to show yet.</p>
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
                      {n.scheduledFor
                        ? new Date(n.scheduledFor).toLocaleString()
                        : new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </GlassPanel>

      </main>
      <Dock items={dockItems} />
    </div>
  );
}

function WorkflowStatCard({ label, value, icon, accent }) {
  return (
    <GlassPanel className={`summary-card ${accent}`}>
      <div className="summary-card-icon">{icon}</div>
      <h3>{label}</h3>
      <p>{value}</p>
    </GlassPanel>
  );
}

export default OrganizerWorkflow;