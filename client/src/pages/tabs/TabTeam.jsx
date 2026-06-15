import { useEffect, useState } from "react";
import "./TabTeam.css";

export default function TabTeam({ eventId }) {
  const [staffMembers, setStaffMembers] = useState([]);
  const [allStaffMembers, setAllStaffMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("");
  const [specialityFilter, setSpecialityFilter] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);

  useEffect(() => {
    loadAllStaffMembers();
    loadStaffMembers();
  }, [employmentTypeFilter, specialityFilter]);

  useEffect(() => {
    loadAllTasks();
  }, [eventId]);

  useEffect(() => {
    loadTasks();
  }, [eventId, taskStatusFilter]);

  async function loadStaffMembers() {
    const params = new URLSearchParams();

    if (employmentTypeFilter) {
        params.append("employmentType", employmentTypeFilter);
    }

    if (specialityFilter) {
        params.append("speciality", specialityFilter);
    }

    const query = params.toString() ? `?${params.toString()}` : "";

    const response = await fetch(`http://localhost:5001/api/team/staff${query}`);
    const data = await response.json();

    setStaffMembers(data);
  }

  async function loadTasks() {
    const query = taskStatusFilter ? `?status=${taskStatusFilter}` : "";

    const response = await fetch(
      `http://localhost:5001/api/team/events/${eventId}/tasks${query}`
    );

    const data = await response.json();
    setTasks(data);
  }

  async function assignTask(taskId, staffId) {
    if (!staffId) return;

    const response = await fetch(`http://localhost:5001/api/team/tasks/${taskId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId }),
    });

    const data = await response.json();

    if (!response.ok) {
        alert(data.message || "Failed to assign task");
        return;
    }

    loadTasks();
  }

  function getStaffName(staffId) {
    const staff = staffMembers.find((member) => member._id === staffId);
    return staff ? staff.fullName || staff.email : "Not assigned";
  }

  function getStaffTaskCount(staffId) {
    return tasks.filter((task) => task.assignedTo === staffId).length;
  }

  function getStaffDoneTaskCount(staffId) {
    return tasks.filter(
        (task) => task.assignedTo === staffId && task.status === "done"
    ).length;
  }

  async function loadAllStaffMembers() {
    const response = await fetch("http://localhost:5001/api/team/staff");
    const data = await response.json();

    setAllStaffMembers(data);
  }

  async function loadAllTasks() {
  if (!eventId) return;

  const response = await fetch(
    `http://localhost:5001/api/team/events/${eventId}/tasks`
  );

  const data = await response.json();

  setAllTasks(data);
}

    const totalStaff = allStaffMembers.length;
    const totalTasks = allTasks.length;
    const unassignedTasks = allTasks.filter(
        (task) => !task.assignedTo || task.status === "not_assigned"
    ).length;
    const doneTasks = allTasks.filter((task) => task.status === "done").length;

  return (
    <div className="team-tab">
      <div className="team-header">
        <h1>👥 Team Members</h1>
        <p>View staff members, assign tasks, and track task status for this event.</p>
      </div>

      <div className="team-summary-cards">
        <div className="team-summary-card">
            <h3>Total Staff</h3>
            <p>{totalStaff}</p>
        </div>

        <div className="team-summary-card">
            <h3>Total Tasks</h3>
            <p>{totalTasks}</p>
        </div>

        <div className="team-summary-card">
            <h3>Unassigned Tasks</h3>
            <p>{unassignedTasks}</p>
        </div>

        <div className="team-summary-card">
            <h3>Done Tasks</h3>
            <p>{doneTasks}</p>
        </div>
        </div>

      <div className="team-layout">
        <section className="team-section">
          <div className="team-section-header">
            <h2>Staff Members</h2>

            <select
              value={employmentTypeFilter}
              onChange={(e) => setEmploymentTypeFilter(e.target.value)}
            >
              <option value="">All types</option>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
            </select>

            <select
                value={specialityFilter}
                onChange={(e) => setSpecialityFilter(e.target.value)}
            >
                <option value="">All specialities</option>
                <option value="Catering">Catering</option>
                <option value="Logistics">Logistics</option>
                <option value="Seating">Seating</option>
                <option value="Guest Service">Guest Service</option>
            </select>
          </div>

          <div className="team-list">
            {staffMembers.map((staff) => (
                <div
                key={staff._id}
                className={`team-card staff-card-clickable ${
                    selectedStaff?._id === staff._id ? "selected-staff-card" : ""
                }`}
                onClick={() =>
                    selectedStaff?._id === staff._id
                    ? setSelectedStaff(null)
                    : setSelectedStaff(staff)
                }
                >
                <div className="staff-name-row">
                <div>
                    <h3>{staff.fullName || staff.email}</h3>
                    <p className="staff-task-count">
                    {getStaffTaskCount(staff._id)} assigned task(s)
                    </p>
                </div>

                <span>{selectedStaff?._id === staff._id ? "▲" : "▼"}</span>
                </div>

                {selectedStaff?._id === staff._id && (
                    <div className="staff-inline-details">
                    <p>Email: {staff.email}</p>
                    <p>Phone: {staff.phone || "Not specified"}</p>
                    <p>Age: {staff.age}</p>
                    <p>Type: {staff.employmentType}</p>
                    <p>Speciality: {staff.speciality}</p>
                    <p>Experience: {staff.experienceYears} years</p>
                    <p>
                        Tasks completed: {getStaffDoneTaskCount(staff._id)} /{" "}
                        {getStaffTaskCount(staff._id)}
                    </p>
                    </div>
                )}
                </div>
            ))}
          </div>
        </section>

        <section className="team-section">
          <div className="team-section-header">
            <h2>Event Tasks</h2>

            <select
              value={taskStatusFilter}
              onChange={(e) => setTaskStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="not_assigned">Not assigned</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className="team-list">
            {tasks.map((task) => (
              <div key={task._id} className="team-card">
                <div className="task-card-top">
                  <div>
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                  </div>

                  <span className={`task-status-badge ${task.status}`}>
                    {task.status}
                  </span>
                </div>

                <div className="task-meta-row">
                <span>Category: {task.category}</span>
                <span>Priority: {task.priority}</span>
                </div>

                <div className="assigned-staff-badge">
                Assigned to: {getStaffName(task.assignedTo)}
                </div>

                <div className="task-progress-row">
                <span>Progress</span>
                <strong>{task.progressPercent || 0}%</strong>
                </div>

                <div className="task-progress-bar">
                <div
                    className="task-progress-fill"
                    style={{ width: `${task.progressPercent || 0}%` }}
                ></div>
                </div>

                <select
                    value={task.assignedTo || ""}
                    onChange={(e) => assignTask(task._id, e.target.value)}
                    className="assign-select"
                    disabled={task.status === "done"}
                >
                  <option value="">Assign staff member</option>

                  {staffMembers.map((staff) => (
                    <option key={staff._id} value={staff._id}>
                      {staff.fullName || staff.email}
                    </option>
                  ))}
                </select>
                {task.status === "done" && (
                    <p className="done-task-note">Completed tasks cannot be reassigned.</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}