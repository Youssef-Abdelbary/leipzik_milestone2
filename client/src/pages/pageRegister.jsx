import { useState } from "react";
import { registerUser } from "../services/serviceRegister";
import { useNavigate, Link } from "react-router-dom";
import "../components/componentTheme.css";
import "./Login.css";

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

    const handleChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value,
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (
            !formData.fullname ||
            !formData.email ||
            !formData.phone ||
            !formData.password ||
            !formData.confirmPassword
        ) {
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
    };

    return (
        <div className="auth-page">
            <form className="auth-card auth-form register-form" onSubmit={handleSubmit}>
                <div className="auth-top">
                    <div className="auth-chip">Register</div>
                    <h1>Create your account</h1>
                    <p className="auth-subtitle">Choose your role and start using the vendor dashboard.</p>
                </div>

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
                                {role.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label>Full Name</label>
                    <input
                        type="text"
                        name="fullname"
                        value={formData.fullname}
                        onChange={handleChange}
                        placeholder="Enter full name"
                    />
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email"
                    />
                </div>

                <div className="form-group">
                    <label>Phone</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                    />
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter password"
                    />
                </div>

                <div className="form-group">
                    <label>Confirm Password</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm password"
                    />
                </div>

                {error && <p className="error-message">{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                </button>

                <p className="auth-meta">
                    Already have an account?{' '}
                    <Link to="/login">Log in</Link>
                </p>
            </form>
        </div>
    );
}