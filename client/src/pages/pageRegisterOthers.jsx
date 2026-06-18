import { useState } from "react";
import { registerForOthers } from "../services/serviceRegisterOthers";
import "../components/componentTheme.css";
import { P, GlassPanel } from "../components/componentTheme";
import { useNavigate } from "react-router-dom";
import "./pageDeactivate.css";
import "./Login.css";
import CurvedLoop from "../components/CurvedLoop";
import { VscHome, VscCalendar, VscPerson, VscAccount, VscPersonAdd, VscTrash} from "react-icons/vsc";
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
  const [success, setSuccess] = useState(false);
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
      await registerForOthers(payload);
      setSuccess(true);
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

  if (success) {
    return (
      <div className="login-page">
        <div className="login-background-glow login-glow-one"></div>
        <div className="login-background-glow login-glow-two"></div>

        <div className="login-marquee login-marquee--top">
          <CurvedLoop
            marqueeText="PopEyez ✦ a moving cafe ✦ "
            speed={1.5}
            curveAmount={180}
            direction="left"
            interactive={false}
          />
        </div>

        <div style={styles.container}>
          <GlassPanel style={styles.card}>
            <div style={styles.successIcon}>✓</div>

            <h2 style={styles.title}>User created</h2>

            <p style={styles.subtitle}>
              The account has been created successfully.
            </p>

            <button style={styles.button} onClick={() => setSuccess(false)}>
              Create another
            </button>
          </GlassPanel>
        </div>

        <div className="login-marquee login-marquee--bottom">
          <CurvedLoop
            marqueeText="PopEyez ✦ a moving cafe ✦ "
            speed={1.5}
            curveAmount={-250}
            direction="right"
            interactive={false}
          />
        </div>

        <Dock items={dockItems} />
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-background-glow login-glow-one"></div>
      <div className="login-background-glow login-glow-two"></div>

      <div className="login-marquee login-marquee--top">
        <CurvedLoop
          marqueeText="PopEyez ✦ a moving cafe ✦ "
          speed={1.5}
          curveAmount={180}
          direction="left"
          interactive={false}
        />
      </div>

      <div style={styles.container}>
        <GlassPanel style={styles.card}>
          <div style={styles.header}>
            <p style={styles.kicker}>Organizer Control</p>

            <h1 style={styles.title}>Create a user</h1>

            <p style={styles.subtitle}>
              Add a vendor, guest, or staff member to the platform.
            </p>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Role</label>

              <div style={styles.roleGroup}>
                {[
                  { label: "Vendor", value: "vendor" },
                  { label: "Staff", value: "staff" },
                ].map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, role: role.value })
                    }
                    style={{
                      ...styles.roleButton,
                      ...(formData.role === role.value
                        ? styles.roleButtonActive
                        : {}),
                    }}
                  >
                    {role.label}
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
                placeholder="Enter password"
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
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? "Creating user..." : "Create user"}
            </button>
          </form>
        </GlassPanel>
      </div>

      <div className="login-marquee login-marquee--bottom">
        <CurvedLoop
          marqueeText="PopEyez ✦ a moving cafe ✦ "
          speed={1.5}
          curveAmount={-250}
          direction="right"
          interactive={false}
        />
      </div>

      <Dock items={dockItems} />
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    minHeight: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    padding: "24px",
    boxSizing: "border-box",
    position: "relative",
    zIndex: 2,
  },

  card: {
    width: "100%",
    maxWidth: "520px",
    padding: "38px",
    background: "rgba(18, 18, 29, 0.82)",
  },

  header: {
    marginBottom: "28px",
  },

  kicker: {
    margin: "0 0 8px",
    color: "#4de7e3",
    fontSize: "12px",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: 950,
    color: P.text,
    letterSpacing: "-0.05em",
    fontFamily: "var(--font-display), system-ui, sans-serif",
  },

  subtitle: {
    margin: "8px 0 0",
    fontSize: "14px",
    color: P.sub,
    lineHeight: 1.6,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "17px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  label: {
    fontSize: "13px",
    fontWeight: 850,
    color: P.text,
  },

  input: {
    padding: "13px 15px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: P.text,
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },

  roleGroup: {
    display: "flex",
    gap: "10px",
  },

  roleButton: {
    flex: 1,
    padding: "12px 10px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: P.sub,
    fontSize: "13px",
    fontWeight: 850,
    cursor: "pointer",
    fontFamily: "inherit",
  },

  roleButtonActive: {
    background: "linear-gradient(135deg, #8b6dff, #4de7e3)",
    color: "#071018",
    border: "1px solid transparent",
    boxShadow:
      "0 12px 28px rgba(77,231,227,0.14), 0 12px 28px rgba(139,109,255,0.14)",
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

  error: {
    background: "rgba(255,82,120,0.12)",
    color: "#ff5c86",
    padding: "12px 14px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: 800,
    marginBottom: "18px",
    border: "1px solid rgba(255,82,120,0.32)",
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
};