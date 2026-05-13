import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(form);
      navigate(location.state?.from?.pathname || "/tours", { replace: true });
    } catch (apiError) {
      setError(apiError.response?.data?.detail || apiError.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-card form-stack" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">Welcome back</p>
        <h2>Log in</h2>
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          autoComplete="email"
          id="email"
          name="email"
          onChange={updateField}
          required
          type="email"
          value={form.email}
        />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          autoComplete="current-password"
          id="password"
          name="password"
          onChange={updateField}
          required
          type="password"
          value={form.password}
        />
      </div>
      <button className="primary-button" disabled={submitting} type="submit">
        {submitting ? "Logging in..." : "Log in"}
      </button>
      <p className="helper-text">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </form>
  );
}
