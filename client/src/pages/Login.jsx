import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

import "../components/componentTheme.css";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const registerMessage = location.state?.successMessage;

  async function handleSubmit(event) {
    event.preventDefault();

    if (email === "" || password === "") {
      setError("Please fill in all fields");
      return;
    }

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
    }
  }

  return (
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
    </div>
  );
}

export default Login;