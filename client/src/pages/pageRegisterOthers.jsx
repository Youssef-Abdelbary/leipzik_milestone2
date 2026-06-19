import { useState } from "react";
import { registerForOthers } from "../services/serviceRegisterOthers";
import "../components/componentTheme.css";
import { P, GlassPanel } from "../components/componentTheme";
import { useNavigate } from "react-router-dom";
import "./pageRegisterOthers.css";
import "./pageEvents.css";
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
        fullname: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="organizer-dashboard-page register-others-page">
      <AppHeader
        crumb="Create User"
        right={
          <div className="organizer-dashboard-pill">
            Organizer Dashboard
          </div>
        }
      />

      <div className="register-others-shell">
        <div className="register-others-header">
          <p className="register-others-kicker">Organizer Control</p>
          <h1 className="register-others-title">Create a user</h1>
          <p className="register-others-subtitle">
            Add a vendor or staff member to the platform.
          </p>
        </div>

        <div className="register-others-body">
          {successInfo ? (
            <GlassPanel className="register-others-card" style={styles.card}>
              <div style={styles.successIcon}>✓</div>

              <h2 style={styles.title}>
                {successInfo.role === "staff" ? "Staff account created" : "User created"}
              </h2>
              {successInfo.role === "staff" && successInfo.emailSent ? (
                <>
                  <p style={styles.subtitle}>
                    Login details were emailed to{" "}
                    <strong style={{ color: "#ede9ff" }}>{successInfo.email}</strong>, including
                    the temporary password and step-by-step login instructions.
                  </p>
                  <p style={styles.successNote}>
                    The staff member can sign in at the login page using their email and the password
                    you set.
                  </p>
                </>
              ) : successInfo.role === "staff" && successInfo.emailWarning ? (
                <>
                  <p style={styles.subtitle}>
                    The staff account was created, but the login email could not be sent.
                  </p>
                  <div style={styles.warning}>{successInfo.emailWarning}</div>
                </>
              ) : (
                <p style={styles.subtitle}>
                  The account has been created successfully.
                </p>
              )}
              <button style={styles.button} onClick={() => setSuccessInfo(null)}>
                Create another
              </button>
            </GlassPanel>
          ) : (
            <GlassPanel className="register-others-card" style={styles.card}>
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
                        className={`register-others-role-btn${
                          formData.role === role.value ? " is-active" : ""
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

                <div className="register-others-form-row">
                  <div className="register-others-field">
                    <label className="register-others-label">Full Name</label>
                    <input
                      className="register-others-input"
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
                      className="register-others-input"
                      type="email"
                      name="email"
                      placeholder="jane@example.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="register-others-field">
                  <label className="register-others-label">Phone</label>
                  <input
                    className="register-others-input"
                    type="tel"
                    name="phone"
                    placeholder="+201009998877"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="register-others-form-row">
                  <div className="register-others-field">
                    <label className="register-others-label">Password</label>
                    <input
                      className="register-others-input"
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
                      className="register-others-input"
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <button className="register-others-submit" type="submit" disabled={loading}>
                  {loading ? "Creating user..." : "Create user"}
                </button>
              </form>
            </GlassPanel>
          )}
        </div>
      </div>

      <Dock items={dockItems} />
    </div>
  );
}

const styles = {
  card: {
    padding: "22px 24px",
    background: "rgba(18, 18, 29, 0.82)",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 950,
    color: P.text,
    letterSpacing: "-0.04em",
    fontFamily: "var(--font-display), system-ui, sans-serif",
  },

  subtitle: {
    margin: "8px 0 0",
    fontSize: "14px",
    color: P.sub,
    lineHeight: 1.6,
  },

  button: {
    marginTop: "10px",
    padding: "14px",
    background: "linear-gradient(135deg, #8b6dff, #4de7e3)",
    color: "#071018",
    border: "none",
    borderRadius: "13px",
    fontSize: "15px",
    fontWeight: 950,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow:
      "0 12px 28px rgba(77,231,227,0.18), 0 12px 28px rgba(139,109,255,0.16)",
  },

  successIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    background: "rgba(77,231,227,0.12)",
    color: "#4de7e3",
    border: "1px solid rgba(77,231,227,0.32)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: 950,
    marginBottom: "20px",
  },


  successNote: {
    margin: "14px 0 0",
    fontSize: "13px",
    color: "rgba(237,233,255,0.45)",
    lineHeight: 1.6,
  },
  warning: {
    marginTop: "16px",
    background: "rgba(245,166,35,0.12)",
    color: "#f5a623",
    padding: "12px 14px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: 700,
    border: "1px solid rgba(245,166,35,0.32)",
    lineHeight: 1.5,
  },
};