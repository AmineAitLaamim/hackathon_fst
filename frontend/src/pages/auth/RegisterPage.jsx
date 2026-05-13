import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApiError } from "../../api/client.js";
import { useAuth } from "../../features/auth/useAuth.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
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
      await register(form);
      navigate("/explore", { replace: true });
    } catch (apiError) {
      setError(getApiError(apiError, "Registration failed."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-card form-stack" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">Start planning</p>
        <h2>Create account</h2>
      </div>
      {error ? <div className="alert error">{error}</div> : null}
      <label className="field" htmlFor="full_name">
        Full name
        <input
          autoComplete="name"
          id="full_name"
          name="full_name"
          onChange={updateField}
          required
          value={form.full_name}
        />
      </label>
      <label className="field" htmlFor="register-email">
        Email
        <input
          autoComplete="email"
          id="register-email"
          name="email"
          onChange={updateField}
          required
          type="email"
          value={form.email}
        />
      </label>
      <label className="field" htmlFor="register-password">
        Password
        <input
          autoComplete="new-password"
          id="register-password"
          minLength={8}
          name="password"
          onChange={updateField}
          required
          type="password"
          value={form.password}
        />
      </label>
      <button className="primary-button" disabled={submitting} type="submit">
        {submitting ? "Creating..." : "Create account"}
      </button>
      <p className="helper-text">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}
