import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
      navigate("/onboarding", { replace: true });
    } catch (apiError) {
      setError(apiError.response?.data?.detail || apiError.message || "Registration failed.");
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
      {error ? <div className="error-box">{error}</div> : null}
      <div className="field">
        <label htmlFor="name">Name</label>
        <input
          autoComplete="name"
          id="name"
          name="name"
          onChange={updateField}
          required
          value={form.name}
        />
      </div>
      <div className="field">
        <label htmlFor="register-email">Email</label>
        <input
          autoComplete="email"
          id="register-email"
          name="email"
          onChange={updateField}
          required
          type="email"
          value={form.email}
        />
      </div>
      <div className="field">
        <label htmlFor="register-password">Password</label>
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
      </div>
      <button className="primary-button" disabled={submitting} type="submit">
        {submitting ? "Creating..." : "Create account"}
      </button>
      <p className="helper-text">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}
