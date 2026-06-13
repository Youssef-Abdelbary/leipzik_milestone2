import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [success, setSuccess] = useState("");

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
      setSuccess(data.message);
      setError("");
      if (data.user.role === "organizer") {
        navigate("/organizer/budget");
      }
      if (data.user.role === "staff") {
        navigate("/staff/shared-layout");
      }

    } else {
      setError(data.message);
      setSuccess("");
    }

  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>👋 Welcome Back</h1>
        <p>Login to continue to your dashboard</p>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter email"
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <button type="submit">🔐 Login</button>
      </form>
    </div>
  );
}
export default Login;