import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateCurrentUser, updateUserHealth, updateUserInterests } from "../../api/auth.js";
import { useAuth } from "../../features/auth/useAuth.js";

function splitCsv(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout, refreshUser, setUser, user } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || "", avatar: user?.avatar || "" });
  const [interests, setInterests] = useState((user?.interests || []).join(", "));
  const [health, setHealth] = useState((user?.health_conditions || user?.health || []).join(", "));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");

  function updateProfile(event) {
    setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function runSave(action, callback) {
    setError("");
    setMessage("");
    setSaving(action);
    try {
      await callback();
      setMessage("Saved.");
    } catch (apiError) {
      setError(apiError.response?.data?.detail || apiError.message || "Could not save changes.");
    } finally {
      setSaving("");
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    await runSave("profile", async () => {
      const updated = await updateCurrentUser(profile);
      setUser(updated);
    });
  }

  async function saveInterests(event) {
    event.preventDefault();
    await runSave("interests", async () => {
      const profileUser = user?.id ? user : await refreshUser();
      await updateUserInterests(profileUser.id, { interests: splitCsv(interests) });
      await refreshUser();
    });
  }

  async function saveHealth(event) {
    event.preventDefault();
    await runSave("health", async () => {
      const profileUser = user?.id ? user : await refreshUser();
      await updateUserHealth(profileUser.id, { conditions: splitCsv(health) });
      await refreshUser();
    });
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <main className="page profile-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Profile</p>
          <h1>Your travel preferences</h1>
        </div>
        <button className="ghost-button" onClick={handleLogout} type="button">
          Logout
        </button>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {message ? <div className="success-box">{message}</div> : null}

      <section className="profile-grid">
        <form className="panel form-stack" onSubmit={saveProfile}>
          <h2>Profile</h2>
          <div className="field">
            <label htmlFor="profile-name">Name</label>
            <input id="profile-name" name="name" onChange={updateProfile} required value={profile.name} />
          </div>
          <div className="field">
            <label htmlFor="profile-avatar">Photo URL</label>
            <input id="profile-avatar" name="avatar" onChange={updateProfile} type="url" value={profile.avatar} />
          </div>
          <button className="primary-button" disabled={saving === "profile"} type="submit">
            Save profile
          </button>
        </form>

        <form className="panel form-stack" onSubmit={saveInterests}>
          <h2>Interests</h2>
          <div className="field">
            <label htmlFor="profile-interests">Interests</label>
            <textarea id="profile-interests" onChange={(event) => setInterests(event.target.value)} value={interests} />
          </div>
          <button className="primary-button" disabled={saving === "interests"} type="submit">
            Save interests
          </button>
        </form>

        <form className="panel form-stack" onSubmit={saveHealth}>
          <h2>Health</h2>
          <div className="field">
            <label htmlFor="profile-health">Conditions</label>
            <textarea id="profile-health" onChange={(event) => setHealth(event.target.value)} value={health} />
          </div>
          <button className="primary-button" disabled={saving === "health"} type="submit">
            Save health
          </button>
        </form>
      </section>
    </main>
  );
}
