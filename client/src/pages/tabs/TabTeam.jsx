import { useEffect, useState } from "react";
import "./TabTeam.css";
import "./workspaceTabShell.css";
import "../../components/componentTheme.css";
import { GlassPanel, icons, P } from "../../components/componentTheme";
import { OpalSelect } from "../../components/componentMenus";
import { apiFetch } from "../../utils/apiFetch";

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
];

const SPECIALITY_OPTIONS = [
  { value: "", label: "All specialities" },
  { value: "Catering", label: "Catering" },
  { value: "Logistics", label: "Logistics" },
  { value: "Seating", label: "Seating" },
  { value: "Guest Service", label: "Guest Service" },
];

const TASK_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "not_assigned", label: "Not assigned" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

function TeamStatCard({ label, value, icon, accent }) {
  const colors = {
    teal: { bg: "rgba(77, 231, 227, 0.1)", color: "#4de7e3", border: "rgba(77, 231, 227, 0.28)" },
    blue: { bg: "rgba(59, 130, 246, 0.14)", color: P.blue, border: "rgba(59, 130, 246, 0.32)" },
    orange: { bg: "rgba(245, 158, 11, 0.14)", color: P.orange, border: "rgba(245, 158, 11, 0.32)" },
    violet: { bg: "rgba(139, 109, 255, 0.14)", color: "#9b7cff", border: "rgba(139, 109, 255, 0.28)" },
  };
  const style = colors[accent] || colors.violet;

  return (
    <GlassPanel className="workspace-stat-card">
      <span
        className="workspace-stat-icon"
        style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
      >
        {icon}
      </span>
      <span>{label}</span>
      <p>{value}</p>
    </GlassPanel>
  );
}

export default function TabTeam({ eventId }) {
  const [staffMembers, setStaffMembers] = useState([]);
  const [allStaffMembers, setAllStaffMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("");
  const [specialityFilter, setSpecialityFilter] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [employmentFilterOpen, setEmploymentFilterOpen] = useState(false);
  const [specialityFilterOpen, setSpecialityFilterOpen] = useState(false);
  const [taskStatusFilterOpen, setTaskStatusFilterOpen] = useState(false);
  const [taskPriorityOpen, setTaskPriorityOpen] = useState(false);
  const [openAssignTaskId, setOpenAssignTaskId] = useState(null);

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    dueDate: "",
  });

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

  function updateTaskForm(field, value) {
    setTaskForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function createTask() {
    if (!taskForm.title || !taskForm.description || !taskForm.category) {
      alert("Please fill title, description, and category.");
      return;
    }

    try {
      await apiFetch(`/team/events/${eventId}/tasks`, {
        method: "POST",
        body: JSON.stringify(taskForm),
      });

      setTaskForm({
        title: "",
        description: "",
        category: "",
        priority: "medium",
        dueDate: "",
      });

      setShowTaskForm(false);

      loadAllTasks();
      loadTasks();
    } catch (error) {
      alert(error.message || "Failed to create task");
    }
  }

  async function loadStaffMembers() {
    const params = new URLSearchParams();

    if (employmentTypeFilter) {
      params.append("employmentType", employmentTypeFilter);
    }

    if (specialityFilter) {
      params.append("speciality", specialityFilter);
    }

    const query = params.toString() ? `?${params.toString()}` : "";

    const data = await apiFetch(`/team/staff${query}`);
    setStaffMembers(data);
  }

  async function loadTasks() {
    const query = taskStatusFilter ? `?status=${taskStatusFilter}` : "";

    const data = await apiFetch(`/team/events/${eventId}/tasks${query}`);
    setTasks(data);
  }

  async function assignTask(taskId, staffId) {
    if (!staffId) return;

    try {
      await apiFetch(`/team/tasks/${taskId}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ staffId }),
      });

      loadTasks();
    } catch (error) {
      alert(error.message || "Failed to assign task");
    }
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
    const data = await apiFetch("/team/staff");
    setAllStaffMembers(data);
  }

  async function loadAllTasks() {
    if (!eventId) return;

    const data = await apiFetch(`/team/events/${eventId}/tasks`);
    setAllTasks(data);
  }

  const totalStaff = allStaffMembers.length;
  const totalTasks = allTasks.length;
  const unassignedTasks = allTasks.filter(
    (task) => !task.assignedTo || task.status === "not_assigned"
  ).length;
  const doneTasks = allTasks.filter((task) => task.status === "done").length;

  const staffSectionOverlay = employmentFilterOpen || specialityFilterOpen;
  const tasksSectionOverlay =
    taskStatusFilterOpen || taskPriorityOpen || openAssignTaskId !== null;

  const staffAssignOptions = [
    { value: "", label: "Assign staff member" },
    ...staffMembers.map((staff) => ({
      value: staff._id,
      label: staff.fullName || staff.email,
    })),
  ];

  return (
    <div className="workspace-tab-shell team-tab">
      <div className="team-header">
        <h1>Team Members</h1>
        <p>View staff members, assign tasks, and track task status for this event.</p>
      </div>

      <div className="workspace-stat-grid">
        <TeamStatCard label="Total Staff" value={totalStaff} icon={icons.team} accent="teal" />
        <TeamStatCard label="Total Tasks" value={totalTasks} icon={icons.clipboard} accent="blue" />
        <TeamStatCard label="Unassigned Tasks" value={unassignedTasks} icon={icons.warning} accent="orange" />
        <TeamStatCard label="Done Tasks" value={doneTasks} icon={icons.check} accent="violet" />
      </div>

      <div className="team-layout">
        <GlassPanel
          className={`team-section${staffSectionOverlay ? " team-section--overlay" : ""}`}
        >
          <div className="team-section-header">
            <div>
              <h2>Staff Members</h2>
              <p>Filter staff and view their task load.</p>
            </div>

            <div className="team-header-actions">
              <OpalSelect
                value={employmentTypeFilter}
                onChange={setEmploymentTypeFilter}
                onOpenChange={setEmploymentFilterOpen}
                options={EMPLOYMENT_TYPE_OPTIONS}
                placeholder="All types"
                accent="teal"
                style={{ minWidth: 150 }}
              />

              <OpalSelect
                value={specialityFilter}
                onChange={setSpecialityFilter}
                onOpenChange={setSpecialityFilterOpen}
                options={SPECIALITY_OPTIONS}
                placeholder="All specialities"
                accent="violet"
                style={{ minWidth: 160 }}
              />
            </div>
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

                  <span className="staff-chevron">
                    {selectedStaff?._id === staff._id ? icons.chevronUp : icons.chevronDown}
                  </span>
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
        </GlassPanel>

        <GlassPanel
          className={`team-section${tasksSectionOverlay ? " team-section--overlay" : ""}`}
        >
          <div className="team-section-header">
            <div>
              <h2>Event Tasks</h2>
              <p>Create tasks, assign staff, and track progress.</p>
            </div>

            <div className="task-header-actions">
              <button
                className="add-task-button"
                onClick={() => setShowTaskForm(!showTaskForm)}
              >
                {showTaskForm ? "Cancel" : "Add Task"}
              </button>

              <OpalSelect
                value={taskStatusFilter}
                onChange={setTaskStatusFilter}
                onOpenChange={setTaskStatusFilterOpen}
                options={TASK_STATUS_OPTIONS}
                placeholder="All statuses"
                accent="amber"
                style={{ minWidth: 160 }}
              />
            </div>
          </div>

          {showTaskForm && (
            <div className="add-task-form">
              <input
                type="text"
                placeholder="Task title"
                value={taskForm.title}
                onChange={(e) => updateTaskForm("title", e.target.value)}
              />

              <input
                type="text"
                placeholder="Description"
                value={taskForm.description}
                onChange={(e) => updateTaskForm("description", e.target.value)}
              />

              <input
                type="text"
                placeholder="Category, e.g. Logistics"
                value={taskForm.category}
                onChange={(e) => updateTaskForm("category", e.target.value)}
              />

              <OpalSelect
                value={taskForm.priority}
                onChange={(value) => updateTaskForm("priority", value)}
                onOpenChange={setTaskPriorityOpen}
                options={PRIORITY_OPTIONS}
                placeholder="Priority"
                accent="violet"
              />

              <input
                type="datetime-local"
                value={taskForm.dueDate}
                onChange={(e) => updateTaskForm("dueDate", e.target.value)}
              />

              <button className="save-task-button" onClick={createTask}>
                Save Task
              </button>
            </div>
          )}

          <div
            className={`team-list${
              openAssignTaskId ? " team-list--dropdown-open" : ""
            }`}
          >
            {tasks.map((task) => (
              <div key={task._id} className="team-card">
                <div className="task-card-top">
                  <div>
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                  </div>

                  <span className={`task-status-badge ${task.status}`}>
                    {(task.status || "").replace("_", " ")}
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

                <OpalSelect
                  value={task.assignedTo || ""}
                  onChange={(value) => assignTask(task._id, value)}
                  onOpenChange={(open) =>
                    setOpenAssignTaskId((current) =>
                      open ? task._id : current === task._id ? null : current
                    )
                  }
                  options={staffAssignOptions}
                  placeholder="Assign staff member"
                  accent="teal"
                  disabled={task.status === "done"}
                  style={{ marginTop: 12 }}
                />

                {task.status === "done" && (
                  <p className="done-task-note">
                    Completed tasks cannot be reassigned.
                  </p>
                )}
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
