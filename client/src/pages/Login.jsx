import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import "../components/componentTheme.css";
import { icons, GlassPanel } from "../components/componentTheme";
import CurvedLoop from "../components/CurvedLoop";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();

    if (email === "" || password === "") {
      setError("Please fill in all fields");
      setSuccess("");
      return;
    }

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

        if (data.user.role === "vendor") {
          navigate("/vendor/dashboard");
        }

        if (data.user.role === "venue_owner") {
          navigate("/venueowner/venues");
        }
        return;
      }

      setError(data.message || "Login failed");
    } catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong while logging in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-background-glow login-glow-one"></div>
      <div className="login-background-glow login-glow-two"></div>

      {/* TOP marquee — arches upward */}
      <div className="login-marquee login-marquee--top">
        <CurvedLoop
          marqueeText="PopEyez ✦ a moving cafe ✦ "
          speed={1.5}
          curveAmount={180}
          direction="left"
          interactive={false}
        />
      </div>

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
      <div className="login-marquee login-marquee--bottom">
        <CurvedLoop
          marqueeText="PopEyez ✦ a moving cafe ✦ "
          speed={1.5}
          curveAmount={-180}
          direction="right"
          interactive={false}
        />
      </div>
    </div>
  );
}

export default Login;