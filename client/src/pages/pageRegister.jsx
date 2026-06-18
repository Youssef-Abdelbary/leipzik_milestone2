import { useState } from "react";
import { registerUser } from "../services/serviceRegister";
import { useNavigate, Link } from "react-router-dom";
import { VscLock, VscPerson, VscDeviceMobile } from "react-icons/vsc";
import "../components/componentTheme.css";
import "./Login.css";
import CurvedLoop from "../components/CurvedLoop";
import { icons, GlassPanel } from "../components/componentTheme";

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

    const navigate = useNavigate();

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function handleChange(event) {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value,
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (
            !formData.fullname ||
            !formData.email ||
            !formData.phone ||
            !formData.password ||
            !formData.confirmPassword
        ) {
            setError("All fields are required");
            return;
        }

        if (!formData.role) {
            setError("Please select a role");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            setLoading(true);

            const { confirmPassword, ...payload } = formData;

            await registerUser(payload);

            navigate("/login", {
                state: {
                    successMessage: "Account created successfully. You can now log in.",
                },
            });
        } catch (err) {
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page register-page">
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

            <GlassPanel className="login-card register-card">
                <div className="login-logo">
                    <div className="login-logo-icon">
                        <VscLock size={24} aria-hidden="true" />
                    </div>
                </div>

                <div className="login-header">
                    <h1>Create Account</h1>
                    <p>Choose your role and start using your PopEyez dashboard.</p>
                </div>

                <form className="login-form register-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>I am a...</label>

                        <div className="role-group">
                            {[
                                { label: "Vendor", value: "vendor" },
                                { label: "Venue Owner", value: "venue_owner" },
                                { label: "Organizer", value: "organizer" },
                            ].map((role) => (
                                <button
                                    key={role.value}
                                    type="button"
                                    className={
                                        formData.role === role.value
                                            ? "role-button role-button-active"
                                            : "role-button"
                                    }
                                    onClick={() =>
                                        setFormData({
                                            ...formData,
                                            role: role.value,
                                        })
                                    }
                                >
                                    <span>{ROLE_ICONS[role.value]}</span>                                    {role.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Full Name</label>
                        <div className="login-input-wrap">
                            <span><VscPerson size={20} aria-hidden="true" /></span>                            <input
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
                            <span>{icons.mail}</span>                            <input
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
                            <span><VscDeviceMobile size={20} aria-hidden="true" /></span>                            <input
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
                            <span><VscLock size={20} aria-hidden="true" /></span>                            <input
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
                            <span><VscLock size={20} aria-hidden="true" /></span>                            <input
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
                            {icons.warning} {error}                        </p>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? "Creating account..." : "Create Account"}
                    </button>

                    <p className="loginText">
                        Already have an account?{" "}
                        <Link to="/login" className="link">
                            Log in
                        </Link>
                    </p>
                </form>
            </GlassPanel>

            <div className="login-marquee login-marquee--bottom">
                <CurvedLoop
                    marqueeText="PopEyez ✦ a moving cafe ✦ "
                    speed={1.5}
                    curveAmount={-350}
                    direction="right"
                    interactive={false}
                />
            </div>
        </div>
    );
}