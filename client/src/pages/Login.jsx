import { useState } from "react";
<<<<<<< HEAD
import { useNavigate, useLocation, Link } from "react-router-dom";

import "../components/componentTheme.css";
import "./Login.css";
=======
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import "../components/componentTheme.css";
import { P, icons, GlassPanel } from "../components/componentTheme";
>>>>>>> d95beca (change the UI design for my pages)

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const navigate = useNavigate();
  const location = useLocation();

  const registerMessage = location.state?.successMessage;

  async function handleSubmit(event) {
    event.preventDefault();

    if (email === "" || password === "") {
      setError("Please fill in all fields");
      setSuccess("");
      return;
    }
<<<<<<< HEAD

    const response = await fetch("http://localhost:5001/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const data = await response.json();

    console.log(data);

    if (response.ok) {
      localStorage.setItem("loggedInUser", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);

      setSuccess(data.message);
      setError("");

      if (data.user.role === "organizer") {
        navigate("/organizer/workflow");
      }

      if (data.user.role === "staff") {
        navigate("/staff/dashboard");
      }

      if (data.user.role === "vendor") {
        navigate("/vendor/dashboard");
      }

      if (data.user.role === "venue_owner") {
        navigate("/venueowner/venues");
      }
    } else {
      setError(data.message);
      setSuccess("");
=======

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("loggedInUser", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken);

        setSuccess(data.message);

        if (data.user.role === "organizer") {
          navigate("/organizer/workflow");
        }

        if (data.user.role === "staff") {
          navigate("/staff/dashboard");
        }

        return;
      }

      setError(data.message || "Login failed");
    } catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong while logging in.");
    } finally {
      setLoading(false);
>>>>>>> d95beca (change the UI design for my pages)
    }
  }

  return (
<<<<<<< HEAD
    <div className="auth-page">
      <form className="auth-card auth-form" onSubmit={handleSubmit}>
        <div className="auth-top">
          <div className="auth-chip">Login</div>
          <h1>Welcome back</h1>
          <p className="auth-subtitle">Sign in to manage your events, orders, and dashboard.</p>
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
          />
        </div>

        {error && <p className="error-message">{error}</p>}
        {registerMessage && <p className="success-message">{registerMessage}</p>}
        {success && <p className="success-message">{success}</p>}

        <button type="submit">Continue</button>

        <p className="auth-meta">
          Don’t have an account? <Link to="/register">Create one</Link>
        </p>
      </form>
=======
    <div className="login-page">
      <div className="login-background-glow login-glow-one"></div>
      <div className="login-background-glow login-glow-two"></div>

      <GlassPanel className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">{icons.lock || "🔐"}</div>
        </div>

        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Log in to continue to your PopEyez dashboard.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>

            <div className="login-input-wrap">
              <span>{icons.mail || "✉️"}</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter email"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>

            <div className="login-input-wrap">
              <span>{icons.key || "●"}</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
              />
            </div>
          </div>

          {error && (
            <p className="error-message">
              {icons.warning} {error}
            </p>
          )}

          {success && <p className="success-message">{success}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="loginText">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="link">
              Sign up
            </Link>
          </p>
        </form>
      </GlassPanel>
>>>>>>> d95beca (change the UI design for my pages)
    </div>
  );
}

export default Login;