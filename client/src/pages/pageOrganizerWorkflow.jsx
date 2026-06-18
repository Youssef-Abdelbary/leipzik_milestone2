import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./pageOrganizerDashboard.css";
import "./pageOrganizerWorkflow.css";
import "../components/componentTheme.css";
import AppHeader from "../components/componentAppHeader";
import { icons, GlassPanel } from "../components/componentTheme";
import Dock from "../components/componentDock";
import { VscHome, VscCalendar, VscPerson, VscPersonAdd, VscTrash } from "react-icons/vsc";
import { fetchNotifications, markNotificationAsRead } from "../services/serviceNotifications";
import {
  fetchWorkflowSummary,
  fetchWorkflowEvents,
  fetchWorkflowTasks,
} from "../services/serviceWorkflow";
import { getUserIdFromToken } from "../utils/apiFetch";

function formatFeedback(value) {
  if (value == null || Number.isNaN(Number(value)) || Number(value) === 0) {
    return "—";
  }
  return Number(value).toFixed(1);
}

function feedbackStatSub(count, label) {
  if (!count) {
    return `No ${label} reviews yet`;
  }
  return `${count} ${label} review${count === 1 ? "" : "s"}`;
}

function IconBadge({ icon, accent = "violet" }) {
  return <span className={`workflow-icon-badge ${accent}`}>{icon}</span>;
}

function SectionTitle({ icon, title, open, onToggle, collapsible = false }) {
  if (collapsible) {
    return (
      <h2 className="collapsible-title" onClick={onToggle}>
        <IconBadge icon={icon} accent="cyan" />
        {title}
        <span className="collapsible-chevron">
          {open ? icons.chevronUp : icons.chevronDown}
        </span>
      </h2>
    );
  }

  return (
    <h2 className="section-title-static">
      <IconBadge icon={icon} accent="amber" />
      {title}
    </h2>
  );
}

function MetaLine({ icon, children }) {
  return (
    <p className="meta-line">
      <span className="meta-line-icon">{icon}</span>
      {children}
    </p>
  );
}

function MetaChip({ children, className = "" }) {
  return <span className={`meta-chip ${className}`.trim()}>{children}</span>;
}

function OrganizerWorkflow() {
  const [summary, setSummary] = useState(null);
  const [summaryState, setSummaryState] = useState("loading");
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [tasks, setTasks] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showEvents, setShowEvents] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadWorkflowData() {
      try {
        const organizerId =
          getUserIdFromToken() ||
          JSON.parse(localStorage.getItem("loggedInUser") || "{}")?._id ||
          JSON.parse(localStorage.getItem("loggedInUser") || "{}")?.id;

        if (!organizerId) {
          setSummaryState("no-auth");
          return;
        }

        const summaryData = await fetchWorkflowSummary(organizerId);
        setSummary(summaryData);
        setSummaryState("ready");

        const eventsData = await fetchWorkflowEvents(organizerId);
        setEvents(Array.isArray(eventsData) ? eventsData : []);

        const tasksData = await fetchWorkflowTasks(organizerId);
        setTasks(Array.isArray(tasksData) ? tasksData : []);

        fetchNotifications(organizerId).then((data) =>
          setNotifications(data.data || data || [])
        );
      } catch (error) {
        console.error("Failed to load workflow data:", error);
        setSummaryState("error");
      }
    }

    loadWorkflowData();
  }, []);

  const eventList = Array.isArray(events) ? events : [];
  const taskList = Array.isArray(tasks) ? tasks : [];

  const filteredEvents = eventList.filter((event) => {
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
    return eventList.find((event) => event._id === taskEventId);
  }

  const filteredTasks = taskList.filter((task) => {
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

  const reminderTasks = taskList.filter((task) => {
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

  const summaryValue = (key) => {
    if (summaryState === "loading") return "Loading…";
    if (summaryState !== "ready" || !summary) return "—";
    return summary[key];
  };

  return (
    <div className="organizer-dashboard-page">
      <AppHeader
        crumb="My Workflow"
        right={<div className="organizer-dashboard-pill">Organizer Dashboard</div>}
      />

      <div className="organizer-dashboard-content">
        {summaryState === "error" && (
          <div className="workflow-load-error" role="alert">
            Could not load workflow data. Make sure the backend is running on port 5001, then refresh.
          </div>
        )}

        {summaryState === "no-auth" && (
          <div className="workflow-load-error" role="alert">
            Please log in as an organizer to view your workflow dashboard.
          </div>
        )}

        <div className="summary-cards">
          <WorkflowStatCard
            label="Today's Events"
            value={summaryValue("todayEventsCount")}
            icon={icons.calendar}
            accent="cyan"
          />
          <WorkflowStatCard
            label="Upcoming Events"
            value={summaryValue("upcomingEventsCount")}
            icon={icons.clock}
            accent="blue"
          />
          <WorkflowStatCard
            label="Avg Positive Feedback"
            value={formatFeedback(summary?.averagePositiveFeedback)}
            sub={feedbackStatSub(summary?.positiveFeedbackReviewCount, "positive")}
            icon={icons.feedback}
            accent="teal"
          />
          <WorkflowStatCard
            label="Avg Negative Feedback"
            value={formatFeedback(summary?.averageNegativeFeedback)}
            sub={feedbackStatSub(summary?.negativeFeedbackReviewCount, "negative")}
            icon={icons.frown}
            accent="orange"
          />
        </div>

        <GlassPanel className="workflow-section">
          <div className="section-header">
            <div>
              <SectionTitle
                icon={icons.calendar}
                title="Upcoming Events"
                open={showEvents}
                onToggle={() => setShowEvents(!showEvents)}
                collapsible
              />
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
                    <MetaLine icon={icons.mapPin}>
                      {event.locationSnapshot?.venueName || "TBD"} —{" "}
                      {event.locationSnapshot?.city || "TBD"}
                    </MetaLine>
                  </div>

                  <div className="event-info">
                    <MetaChip>
                      {event.date
                        ? new Date(event.date).toLocaleDateString()
                        : "No date"}
                    </MetaChip>
                    <MetaChip>{event.startTime || "No time"}</MetaChip>
                    <MetaChip className="event-status">
                      {event.status || "planning"}
                    </MetaChip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>

        <GlassPanel className="workflow-section">
          <div className="section-header">
            <div>
              <SectionTitle
                icon={icons.check}
                title="Event Tasks"
                open={showTasks}
                onToggle={() => setShowTasks(!showTasks)}
                collapsible
              />
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
                const statusLabel = (task.status || "unknown").replace("_", " ");

                return (
                  <div className="task-card" key={task._id}>
                    <div>
                      <h3>{task.title}</h3>
                      <p>{task.description}</p>
                      <MetaLine icon={icons.tag}>{task.category}</MetaLine>
                      <MetaLine icon={icons.calendar}>
                        Event: {taskEvent?.title || task.eventTitle || "Unknown event"}
                      </MetaLine>
                    </div>

                    <div className="task-info">
                      <MetaChip className={`task-status ${task.status || ""}`}>
                        {statusLabel}
                      </MetaChip>
                      <MetaChip>{task.priority || "medium"} priority</MetaChip>
                      <MetaChip>
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString()
                          : "No due date"}
                      </MetaChip>
                      <MetaChip>{task.progressPercent || 0}%</MetaChip>
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
              <SectionTitle icon={icons.warning} title="Due Task Reminders" />
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
                      {isOverdue ? icons.warning : icons.clock}{" "}
                      {task.title}
                    </h3>
                    <p>{task.description}</p>
                    <MetaLine icon={icons.calendar}>
                      Event: {taskEvent?.title || task.eventTitle || "Unknown event"}
                    </MetaLine>
                    {isOverdue && (
                      <p className="overdue-text">Deadline has passed</p>
                    )}
                  </div>

                  <div className="reminder-info">
                    <MetaChip>Due: {dueDate.toLocaleDateString()}</MetaChip>
                    <MetaChip>
                      {dueDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </MetaChip>
                    <MetaChip>{task.priority || "medium"} priority</MetaChip>
                    <MetaChip className={isOverdue ? "overdue-badge" : "upcoming-badge"}>
                      {isOverdue ? "Overdue" : "Upcoming"}
                    </MetaChip>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassPanel>

        <GlassPanel className="workflow-section notifications-section">
          <div className="section-header simple">
            <div>
              <SectionTitle icon={icons.bell} title="Notifications" />
              <p>
                {notifications.filter((n) => n.status === "unread").length > 0
                  ? `${notifications.filter((n) => n.status === "unread").length} unread`
                  : "You're all caught up."}
              </p>
            </div>
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <p className="empty-message">No notifications to show yet.</p>
            ) : (
              notifications.map((n) => {
                const isUnread = n.status === "unread";
                return (
                  <div
                    key={n._id || n.id}
                    className={`notification-card ${isUnread ? "notification-card--unread" : ""}`}
                    onClick={() => isUnread && handleMarkAsRead(n._id)}
                    role={isUnread ? "button" : undefined}
                    tabIndex={isUnread ? 0 : undefined}
                  >
                    <div className="notification-card-top">
                      <div className="notification-card-title">{n.title}</div>
                      {isUnread && <span className="notification-new-badge">NEW</span>}
                    </div>
                    <div className="notification-card-message">{n.message}</div>
                    <div className="notification-card-time">
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
      </div>

      <Dock items={dockItems} />
    </div>
  );
}

function WorkflowStatCard({ label, value, sub, icon, accent }) {
  return (
    <GlassPanel className={`summary-card ${accent}`}>
      <div className="summary-card-icon">{icon}</div>
      <h3>{label}</h3>
      <p>{value}</p>
      {sub && <span className="summary-card-sub">{sub}</span>}
    </GlassPanel>
  );
}

export default OrganizerWorkflow;
