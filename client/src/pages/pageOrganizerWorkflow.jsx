import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./pageOrganizerWorkflow.css";
import "./pageOrganizerDashboard.css";
import "../components/componentTheme.css";
import AppHeader from "../components/componentAppHeader";
import { P, icons, GlassPanel } from "../components/componentTheme";
import Dock from "../components/componentDock";
import { VscHome, VscCalendar, VscPerson, VscPersonAdd, VscTrash} from "react-icons/vsc";

function IconBadge({ icon, tone = "violet" }) {
  return <span className={`workflow-icon-badge workflow-icon-badge--${tone}`}>{icon}</span>;
}

function SectionTitle({ icon, title, subtitle, onClick, expanded }) {
  const TitleTag = onClick ? "button" : "h2";

  return (
    <div className="workflow-section-heading">
      <TitleTag
        type={onClick ? "button" : undefined}
        className={onClick ? "collapsible-title workflow-section-title-btn" : "workflow-section-title"}
        onClick={onClick}
      >
        {icon && <IconBadge icon={icon} tone="cyan" />}
        <span className="workflow-section-title-text">{title}</span>
        {onClick && (
          <span className="section-chevron">
            {expanded ? icons.chevronUp : icons.chevronDown}
          </span>
        )}
      </TitleTag>
      {subtitle && <p className="workflow-section-subtitle">{subtitle}</p>}
    </div>
  );
}

function MetaLine({ icon, children, className = "" }) {
  return (
    <p className={`workflow-meta-line ${className}`.trim()}>
      {icon && <span className="workflow-meta-icon">{icon}</span>}
      {children}
    </p>
  );
}

function MetaChip({ icon, children, className = "" }) {
  return (
    <span className={`workflow-meta-chip ${className}`.trim()}>
      {icon && <span className="workflow-meta-icon">{icon}</span>}
      {children}
    </span>
  );
}


function formatFeedback(value, { emptyLabel = "—" } = {}) {
  if (value == null || Number.isNaN(Number(value)) || Number(value) === 0) {
    return emptyLabel;
  }
  return Number(value).toFixed(2);
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
          setSummaryState("no-auth");
          setSummary({
            todayEventsCount: 0,
            upcomingEventsCount: 0,
            averagePositiveFeedback: 0,
            averageNegativeFeedback: 0,
          });
          return;
        }

        const organizerId = loggedInUser._id || loggedInUser.id;

        console.log("Logged in user:", loggedInUser);
        console.log("Organizer ID sent to backend:", organizerId);

        setSummaryState("loading");

        const summaryData = await fetchJson(
          `http://localhost:5001/api/workflow/summary/${organizerId}`
        );
        setSummary(summaryData);
        setSummaryState("ready");

        const eventsData = await fetchJson(
          `http://localhost:5001/api/workflow/events/${organizerId}`
        );
        setEvents(Array.isArray(eventsData) ? eventsData : []);

        const tasksData = await fetchJson(
          `http://localhost:5001/api/workflow/tasks/${organizerId}`
        );
        setTasks(Array.isArray(tasksData) ? tasksData : []);
      } catch (error) {
        console.error("Failed to load workflow data:", error);
        setSummaryState("error");
        setSummary({
          todayEventsCount: 0,
          upcomingEventsCount: 0,
          averagePositiveFeedback: 0,
          averageNegativeFeedback: 0,
        });
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

  const emptySummary = {
    todayEventsCount: 0,
    upcomingEventsCount: 0,
    averagePositiveFeedback: 0,
    averageNegativeFeedback: 0,
  };

  const displaySummary = summary || emptySummary;

  function statValue(value) {
    if (summaryState === "loading") {
      return "Loading...";
    }

    return value;
  }

  return (
    <div className="organizer-dashboard-page">
      <AppHeader
        crumb="My Workflow"
        right={
          <div className="organizer-dashboard-pill">
            Organizer Dashboard
          </div>
        }
      />
      <div className="organizer-dashboard-content">
        <div className="organizer-page-heading">
          <p className="organizer-page-kicker">Dashboard Overview</p>
          <h1 className="organizer-page-title">My Workflow</h1>
          <p className="organizer-page-desc">
            Track events, tasks, feedback, and reminders in one place.
          </p>
        </div>

        {summaryState === "error" && (
          <p className="workflow-load-error">
            Could not load dashboard data. Make sure the backend is running on port 5001, then refresh.
          </p>
        )}

        {summaryState === "no-auth" && (
          <p className="workflow-load-error">
            Session expired. Please log in again.
          </p>
        )}

        <div className="summary-cards">
          <WorkflowStatCard
            label="Today's Events"
            value={statValue(displaySummary.todayEventsCount)}
            icon={icons.calendar}
            accent="cyan"
          />

          <WorkflowStatCard
            label="Upcoming Events"
            value={statValue(displaySummary.upcomingEventsCount)}
            icon={icons.clock}
            accent="blue"
          />

          <WorkflowStatCard
            label="Avg Positive Feedback"
            value={
              summaryState === "loading"
                ? "Loading..."
                : formatFeedback(displaySummary.averagePositiveFeedback)
            }
            sub={
              summaryState === "ready" && displaySummary.positiveFeedbackCount
                ? `${displaySummary.positiveFeedbackCount} review${displaySummary.positiveFeedbackCount === 1 ? "" : "s"} (4★+)`
                : summaryState === "ready"
                  ? "No positive reviews yet"
                  : null
            }
            icon={icons.star}
            accent="teal"
          />

          <WorkflowStatCard
            label="Avg Negative Feedback"
            value={
              summaryState === "loading"
                ? "Loading..."
                : formatFeedback(displaySummary.averageNegativeFeedback)
            }
            sub={
              summaryState === "ready" && displaySummary.negativeFeedbackCount
                ? `${displaySummary.negativeFeedbackCount} review${displaySummary.negativeFeedbackCount === 1 ? "" : "s"} (≤2★)`
                : summaryState === "ready"
                  ? "No negative reviews yet"
                  : null
            }
            icon={icons.frown}
            accent="orange"
          />
        </div>

        <GlassPanel className="workflow-section">
          <div className="section-header">
            <SectionTitle
              icon={icons.calendar}
              title="Upcoming Events"
              subtitle="View and filter upcoming events by date."
              onClick={() => setShowEvents(!showEvents)}
              expanded={showEvents}
            />

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
                    <MetaChip icon={icons.calendar}>
                      {event.date
                        ? new Date(event.date).toLocaleDateString()
                        : "No date"}
                    </MetaChip>
                    <MetaChip icon={icons.clock}>
                      {event.startTime || "No time"}
                    </MetaChip>
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
            <SectionTitle
              icon={icons.check}
              title="Event Tasks"
              subtitle="Track tasks leading up to each event and filter them by status."
              onClick={() => setShowTasks(!showTasks)}
              expanded={showTasks}
            />

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

                      <MetaLine icon={icons.tag} className="task-category">
                        {task.category}
                      </MetaLine>

                      <MetaLine icon={icons.calendar} className="task-event-name">
                        Event: {taskEvent?.title || task.eventTitle || "Unknown event"}
                      </MetaLine>
                    </div>

                    <div className="task-info">
                      <span className={`task-status ${task.status || "pending"}`}>
                        {(task.status || "pending").replace("_", " ")}
                      </span>

                      <MetaChip icon={icons.zap}>{task.priority}</MetaChip>

                      <MetaChip icon={icons.calendar}>
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString()
                          : "No due date"}
                      </MetaChip>

                      <MetaChip icon={icons.barChart}>
                        {task.progressPercent || 0}%
                      </MetaChip>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassPanel>

        <GlassPanel className="workflow-section reminders-section">
          <div className="section-header simple">
            <SectionTitle
              icon={icons.bell}
              title="Due Task Reminders"
              subtitle="Tasks that still need attention before upcoming events."
            />
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
                    <h3 className="reminder-card-title">
                      <IconBadge
                        icon={isOverdue ? icons.warning : icons.clock}
                        tone={isOverdue ? "red" : "orange"}
                      />
                      {task.title}
                    </h3>
                    <p>{task.description}</p>

                    <MetaLine icon={icons.calendar} className="task-event-name">
                      Event: {taskEvent?.title || task.eventTitle || "Unknown event"}
                    </MetaLine>

                    {isOverdue && (
                      <p className="overdue-text">Deadline has passed</p>
                    )}
                  </div>

                  <div className="reminder-info">
                    <MetaChip icon={icons.calendar}>
                      Due: {dueDate.toLocaleDateString()}
                    </MetaChip>

                    <MetaChip icon={icons.clock}>
                      {dueDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </MetaChip>

                    <MetaChip icon={icons.zap}>{task.priority}</MetaChip>

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
            <SectionTitle
              icon={icons.messages}
              title="Notifications"
              subtitle="General organizer notifications will appear here."
            />
          </div>

          <div className="notifications-list">
            <p className="empty-message">No notifications to show yet.</p>
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