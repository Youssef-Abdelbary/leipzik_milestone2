import { useState } from "react";
import { registerForOthers } from "../services/serviceRegisterOthers";
<<<<<<< Updated upstream

export default function RegisterForOthers() {
    const [formData, setFormData] = useState({
=======
import "../components/componentTheme.css";
import { GlassPanel, icons } from "../components/componentTheme";
import { useNavigate } from "react-router-dom";
import "./pageOrganizerDashboard.css";
import AppHeader from "../components/componentAppHeader";
import { VscHome, VscCalendar, VscPerson, VscPersonAdd, VscTrash } from "react-icons/vsc";
import Dock from "../components/componentDock";

export default function RegisterForOthers() {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullname || !formData.email || !formData.password || !formData.phone) {
      return setError("All fields are required");
    }

    if (!formData.role) {
      return setError("Please select a role");
    }

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);

    try {
      const { confirmPassword, ...payload } = formData;
      const createdRole = payload.role;
      const createdEmail = payload.email;
      const result = await registerForOthers(payload);
      setSuccessInfo({
        role: createdRole,
        email: createdEmail,
        emailSent: Boolean(result.emailSent),
        emailWarning: result.emailWarning || null,
      });
      setFormData({
>>>>>>> Stashed changes
        fullname: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "",
    });

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!formData.fullname || !formData.email || !formData.password || !formData.phone) {
            return setError("All fields are required");
        }

        if (!formData.role) {
            return setError("Please select a role");
        }

        if (formData.password !== formData.confirmPassword) {
            return setError("Passwords do not match");
        }

        setLoading(true);
        try {
            const { confirmPassword, ...payload } = formData;
            await registerForOthers(payload);
            setSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <h2 style={styles.title}>User created</h2>
                    <p style={styles.subtitle}>The account has been created successfully.</p>
                    <button style={styles.button} onClick={() => setSuccess(false)}>
                        Create another
                    </button>
                </div>
            </div>
        );
    }

<<<<<<< Updated upstream
    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>Create a user</h1>
                <p style={styles.subtitle}>Add a vendor, guest, or staff member</p>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.field}>
                        <label style={styles.label}>Role</label>
                        <div style={styles.roleGroup}>
                            {[
                                { label: "Vendor", value: "vendor" },
                                { label: "Guest", value: "guest" },
                                { label: "Staff", value: "staff" },
                            ].map((r) => (
                                <button
                                    key={r.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: r.value })}
                                    style={{
                                        ...styles.roleButton,
                                        ...(formData.role === r.value ? styles.roleButtonActive : {}),
                                    }}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Full Name</label>
                        <input
                            style={styles.input}
                            type="text"
                            name="fullname"
                            placeholder="John Doe"
                            value={formData.fullname}
                            onChange={handleChange}
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Email</label>
                        <input
                            style={styles.input}
                            type="email"
                            name="email"
                            placeholder="jane@example.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Phone</label>
                        <input
                            style={styles.input}
                            type="tel"
                            name="phone"
                            placeholder="+201009998877"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Password</label>
                        <input
                            style={styles.input}
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Confirm Password</label>
                        <input
                            style={styles.input}
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                    </div>

                    <button style={styles.button} type="submit" disabled={loading}>
                        {loading ? "Creating user..." : "Create user"}
                    </button>
                </form>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        padding: "24px",
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "40px",
        width: "100%",
        maxWidth: "460px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    },
    title: {
        fontSize: "24px",
        fontWeight: "700",
        marginBottom: "6px",
        color: "#111",
    },
    subtitle: {
        fontSize: "14px",
        color: "#666",
        marginBottom: "28px",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    field: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    label: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#333",
    },
    input: {
        padding: "10px 14px",
        borderRadius: "8px",
        border: "1px solid #ddd",
        fontSize: "14px",
        outline: "none",
    },
    roleGroup: {
        display: "flex",
        gap: "10px",
    },
    roleButton: {
        flex: 1,
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid #ddd",
        backgroundColor: "#fff",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        color: "#333",
    },
    roleButtonActive: {
        backgroundColor: "#111",
        color: "#fff",
        border: "1px solid #111",
    },
    button: {
        marginTop: "8px",
        padding: "12px",
        backgroundColor: "#111",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        fontSize: "15px",
        fontWeight: "600",
        cursor: "pointer",
    },
    error: {
        backgroundColor: "#fff0f0",
        color: "#cc0000",
        padding: "10px 14px",
        borderRadius: "8px",
        fontSize: "13px",
        marginBottom: "16px",
        border: "1px solid #ffcccc",
    },
};
=======
  const dockItems = [
    {
      icon: <VscHome size={26} />,
      label: "Home",
      active: false,
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
      active: true,
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
    <div className="organizer-dashboard-page">
      <AppHeader
        crumb="Create User"
        right={
          <div className="organizer-dashboard-pill">
            Organizer Dashboard
          </div>
        }
      />

      <div className="organizer-dashboard-content organizer-dashboard-content--centered">
        {successInfo ? (
          <GlassPanel
            className="organizer-card-in register-others-card register-others-success"
          >
            <div className="register-others-success-icon">{icons.check}</div>
            <h2 className="organizer-page-title">
              {successInfo.role === "staff" ? "Staff account created" : "User created"}
            </h2>
            {successInfo.role === "staff" && successInfo.emailSent ? (
              <>
                <p className="organizer-page-desc">
                  Login details were emailed to{" "}
                  <strong style={{ color: "#ede9ff" }}>{successInfo.email}</strong>, including
                  the temporary password and step-by-step login instructions.
                </p>
                <p className="register-others-success-note">
                  The staff member can sign in at the login page using their email and the password
                  you set.
                </p>
              </>
            ) : successInfo.role === "staff" && successInfo.emailWarning ? (
              <>
                <p className="organizer-page-desc">
                  The staff account was created, but the login email could not be sent.
                </p>
                <div className="register-others-warning">{successInfo.emailWarning}</div>
              </>
            ) : (
              <p className="organizer-page-desc">
                The account has been created successfully.
              </p>
            )}
            <button
              className="organizer-btn-primary register-others-btn-full"
              onClick={() => setSuccessInfo(null)}
            >
              Create another
            </button>
          </GlassPanel>
        ) : (
          <GlassPanel
            className="organizer-card-in register-others-card"
            style={{ "--stagger-delay": "0.05s" }}
          >
            <div className="organizer-page-heading">
              <p className="organizer-page-kicker">Organizer Control</p>
              <h1 className="organizer-page-title">Create a user</h1>
              <p className="organizer-page-desc">
                Add a vendor or staff member to the platform.
              </p>
            </div>

            {error && <div className="register-others-error">{error}</div>}

            <form onSubmit={handleSubmit} className="register-others-form">
              <div className="register-others-field">
                <label className="register-others-label">Role</label>
                <div className="register-others-role-group">
                  {[
                    { label: "Vendor", value: "vendor" },
                    { label: "Staff", value: "staff" },
                  ].map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      className={`register-others-role-btn ${
                        formData.role === role.value ? "active" : ""
                      }`}
                      onClick={() =>
                        setFormData({ ...formData, role: role.value })
                      }
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="register-others-field">
                <label className="register-others-label">Full Name</label>
                <input
                  className="organizer-input"
                  type="text"
                  name="fullname"
                  placeholder="John Doe"
                  value={formData.fullname}
                  onChange={handleChange}
                />
              </div>

              <div className="register-others-field">
                <label className="register-others-label">Email</label>
                <input
                  className="organizer-input"
                  type="email"
                  name="email"
                  placeholder="jane@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="register-others-field">
                <label className="register-others-label">Phone</label>
                <input
                  className="organizer-input"
                  type="tel"
                  name="phone"
                  placeholder="+201009998877"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="register-others-field">
                <label className="register-others-label">Password</label>
                <input
                  className="organizer-input"
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div className="register-others-field">
                <label className="register-others-label">Confirm Password</label>
                <input
                  className="organizer-input"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              <button
                className="organizer-btn-primary register-others-btn-full"
                type="submit"
                disabled={loading}
              >
                {loading ? "Creating user..." : "Create user"}
              </button>
            </form>
          </GlassPanel>
        )}
      </div>

      <Dock items={dockItems} />
    </div>
  );
}
>>>>>>> Stashed changes
