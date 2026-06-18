import { useState } from "react";
import { registerUser } from "../services/serviceRegister";
<<<<<<< Updated upstream
=======
import { useNavigate, Link } from "react-router-dom";
import { VscLock, VscPerson, VscDeviceMobile, VscCheck } from "react-icons/vsc";
import "../components/componentTheme.css";
import "./Login.css";
import CurvedLoop from "../components/CurvedLoop";
import { icons, GlassPanel } from "../components/componentTheme";
>>>>>>> Stashed changes

const ROLE_ICONS = {
    vendor: icons.utensils,
    venue_owner: icons.building2,
    organizer: icons.ticket,
};

export default function Register() {
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
            const data = await registerUser(payload);

            localStorage.setItem("token", data.token);
            localStorage.setItem("refreshToken", data.refreshToken);

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
                    <h2 style={styles.title}>You're in</h2>
                    <p style={styles.subtitle}>Your account has been created successfully.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>Create your account</h1>
                <p style={styles.subtitle}>Start planning your next pop-up event</p>

                {error && <div style={styles.error}>{error}</div>}

<<<<<<< Updated upstream
                <form onSubmit={handleSubmit} style={styles.form}>
=======
            <GlassPanel className="login-card register-card">
                <div className="login-logo">
                    <div className="login-logo-icon">
                        <VscLock size={24} aria-hidden="true" />
                    </div>
                </div>
>>>>>>> Stashed changes

                    <div style={styles.field}>
                        <label style={styles.label}>I am a...</label>
                        <div style={styles.roleGroup}>
                            {[
                                { label: "Vendor", value: "vendor" },
                                { label: "Venue Owner", value: "venue_owner" },
<<<<<<< Updated upstream
                                { label: "Event Organizer", value: "organizer" },
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
                            required
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
                            required
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
                            required
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
                            required
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
                            required
                        />
                    </div>

                    <button style={styles.button} type="submit" disabled={loading}>
                        {loading ? "Creating account..." : "Create account"}
=======
                                { label: "Organizer", value: "organizer" },
                            ].map((role) => {
                                const isSelected = formData.role === role.value;

                                return (
                                    <button
                                        key={role.value}
                                        type="button"
                                        className={
                                            isSelected
                                                ? "role-button role-button-active"
                                                : "role-button"
                                        }
                                        aria-pressed={isSelected}
                                        onClick={() =>
                                            setFormData({
                                                ...formData,
                                                role: role.value,
                                            })
                                        }
                                    >
                                        <span>{ROLE_ICONS[role.value]}</span>
                                        {role.label}
                                        {isSelected && (
                                            <VscCheck
                                                size={14}
                                                className="role-button-check"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Full Name</label>
                        <div className="login-input-wrap">
                            <span><VscPerson size={20} aria-hidden="true" /></span>
                            <input
                                type="text"
                                name="fullname"
                                value={formData.fullname}
                                onChange={handleChange}
                                placeholder="Enter full name"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <div className="login-input-wrap">
                            <span>{icons.mail}</span>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter email"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Phone</label>
                        <div className="login-input-wrap">
                            <span><VscDeviceMobile size={20} aria-hidden="true" /></span>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Enter phone number"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="login-input-wrap">
                            <span><VscLock size={20} aria-hidden="true" /></span>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter password"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <div className="login-input-wrap">
                            <span><VscLock size={20} aria-hidden="true" /></span>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm password"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="error-message">
                            {icons.warning} {error}
                        </p>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? "Creating account..." : "Create Account"}
>>>>>>> Stashed changes
                    </button>
                </form>

                <p style={styles.loginText}>
                    Already have an account? <a href="/login" style={styles.link}>Log in</a>
                </p>
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
    loginText: {
        marginTop: "20px",
        fontSize: "13px",
        textAlign: "center",
        color: "#666",
    },
    link: {
        color: "#111",
        fontWeight: "600",
        textDecoration: "underline",
    },
};