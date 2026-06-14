import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./pageOrganizerWorkflow.css";

function OrganizerWorkflow() {
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  const [tasks, setTasks] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");

  const [showEvents, setShowEvents] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [notifications, setNotifications] = useState([]);
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

            const notificationsData = await fetchJson(
                `http://localhost:5001/api/workflow/notifications/${organizerId}`
            );
            setNotifications(notificationsData);
            } catch (error) {
            console.error("Failed to load workflow data:", error);
            }
        }

        loadWorkflowData();
    }, []);
    const filteredEvents = events.filter((event) => {
        if (selectedDate === "") {
            return true;
        }

        const eventDate = new Date(event.date).toISOString().split("T")[0];

        return eventDate === selectedDate;
    });

    const filteredTasks = tasks.filter((task) => {
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

        const dueDate = new Date(task.dueDate);

        return dueDate >= now;
    });

    async function handleMarkNotificationAsRead(notificationId) {
        try {
            const response = await fetch(
            `http://localhost:5001/api/workflow/notifications/${notificationId}/read`,
            {
                method: "PATCH",
            }
            );

            const data = await response.json();

            if (!response.ok) {
            throw new Error(data.message || "Failed to mark notification as read");
            }

            setNotifications((currentNotifications) =>
            currentNotifications.map((notification) =>
                notification._id === notificationId
                ? { ...notification, status: "read" }
                : notification
            )
            );
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    }
  return (
    <div className="workflow-page">
        <div className="workflow-header-row">
        <div>
            <h1>📋 Organizer Daily Workflow</h1>
            <p>Overview of today’s events, upcoming events, and feedback.</p>
        </div>

        <button
            className="view-events-button"
            onClick={() => navigate("/organizer/events")}
        >
            View Events
        </button>
        </div>

      <div className="summary-cards">
        <div className="summary-card">
          <h3>📅 Today's Events</h3>
          <p>{summary ? summary.todayEventsCount : "Loading..."}</p>
        </div>

        <div className="summary-card">
          <h3>⏳ Upcoming Events</h3>
          <p>{summary ? summary.upcomingEventsCount : "Loading..."}</p>
        </div>

        <div className="summary-card">
          <h3>😊 Avg Positive Feedback</h3>
          <p>{summary ? summary.averagePositiveFeedback.toFixed(2) : "Loading..."}</p>
        </div>

        <div className="summary-card">
          <h3>⚠️ Avg Negative Feedback</h3>

          <p>{summary ? summary.averageNegativeFeedback.toFixed(2) : "Loading..."}</p>
        </div>
      </div>
      <div className="events-section">
        <div className="section-header">
            <div>
            <h2
                className="collapsible-title"
                onClick={() => setShowEvents(!showEvents)}
                >
                📅 Upcoming Events {showEvents ? "▲" : "▼"}
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
                    📍 {event.locationSnapshot?.venueName || "TBD"} -{" "}
                    {event.locationSnapshot?.city || "TBD"}
                </p>
                </div>

                <div className="event-info">
                <span>{new Date(event.date).toLocaleDateString()}</span>
                <span>{event.startTime}</span>
                <span className="event-status">{event.status}</span>
                </div>
            </div>
            ))}
        </div>
        )}
        </div>
        <div className="tasks-section">
            <div className="section-header">
                <div>
                <h2
                    className="collapsible-title"
                    onClick={() => setShowTasks(!showTasks)}
                    >
                    ✅ Event Tasks {showTasks ? "▲" : "▼"}
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

                {filteredTasks.map((task) => (
                <div className="task-card" key={task._id}>
                    <div>
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                    <p className="task-category">📌 {task.category}</p>
                    </div>

                    <div className="task-info">
                    <span className={`task-status ${task.status}`}>
                        {task.status.replace("_", " ")}
                    </span>

                    <span>🔥 {task.priority}</span>

                    <span>
                        📅 {new Date(task.dueDate).toLocaleDateString()}
                    </span>

                    <span>📊 {task.progressPercent}%</span>
                    </div>
                </div>
                ))}
            </div>
            )}
            <div className="reminders-section">
                <h2>🔔 Due Task Reminders</h2>
                <p>Tasks that still need attention before upcoming events.</p>

                <div className="reminders-list">
                    {reminderTasks.length === 0 && (
                    <p className="empty-message">No due task reminders right now.</p>
                    )}

                    {reminderTasks.map((task) => (
                    <div className="reminder-card" key={task._id}>
                        <div>
                        <h3>⚠️ {task.title}</h3>
                        <p>{task.description}</p>
                        </div>

                        <div className="reminder-info">
                        <span>📅 Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        <span>⏰ {new Date(task.dueDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}</span>
                        <span>🔥 {task.priority}</span>
                        </div>
                    </div>
                    ))}
                </div>
                </div>
                <div className="notifications-section">
                    <h2>🔔 Notifications</h2>
                    <p>Unread task reminder notifications for the organizer.</p>

                    <div className="notifications-list">
                        {notifications.length === 0 && (
                        <p className="empty-message">No notifications yet.</p>
                        )}

                        {notifications.map((notification) => (
                        <div className="notification-card" key={notification._id}>
                            <div>
                            <h3>{notification.title}</h3>
                            <p>{notification.message}</p>
                            </div>

                            <div className="notification-info">
                            <span>{notification.status}</span>

                            <span>
                                ⏰{" "}
                                {new Date(notification.scheduledFor).toLocaleString([], {
                                dateStyle: "medium",
                                timeStyle: "short",
                                })}
                            </span>

                            {notification.status === "unread" && (
                                <button
                                className="mark-read-button"
                                onClick={() => handleMarkNotificationAsRead(notification._id)}
                                >
                                Mark as Read
                                </button>
                            )}
                            </div>
                        </div>
                        ))}
                    </div>
                    </div>
            </div>
    </div>
  );
}

export default OrganizerWorkflow;