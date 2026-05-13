import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getApiError } from "../../api/client.js";
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
      navigate(location.state?.from?.pathname || "/explore", { replace: true });
    } catch (apiError) {
      setError(getApiError(apiError, "Login failed."));
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
      {error ? <div className="alert error">{error}</div> : null}
      <label className="field" htmlFor="email">
        Email
        <input
          autoComplete="email"
          id="email"
          name="email"
          onChange={updateField}
          required
          type="email"
          value={form.email}
        />
      </label>
      <label className="field" htmlFor="password">
        Password
        <input
          autoComplete="current-password"
          id="password"
          name="password"
          onChange={updateField}
          required
          type="password"
          value={form.password}
        />
      </label>
      <button className="primary-button" disabled={submitting} type="submit">
        {submitting ? "Logging in..." : "Log in"}
      </button>
      <p className="helper-text">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </form>
  );
}
