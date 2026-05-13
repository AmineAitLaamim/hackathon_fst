import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateCurrentUser, updateUserHealth, updateUserInterests } from "../../api/auth.js";
import { useAuth } from "../../features/auth/useAuth.js";

const interestOptions = ["souks", "food", "history", "gardens", "architecture", "crafts"];
const healthOptions = ["limited walking", "wheelchair access", "heat sensitivity", "dietary needs"];

function ToggleChips({ options, selected, onChange }) {
  function toggle(option) {
    onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]);
  }

  return (
    <div className="chip-grid">
      {options.map((option) => (
        <button
          className={`chip ${selected.includes(option) ? "selected" : ""}`}
          key={option}
          onClick={() => toggle(option)}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { refreshUser, setUser, user } = useAuth();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({ name: user?.name || "", avatar: user?.avatar || "" });
  const [interests, setInterests] = useState(user?.interests || []);
  const [health, setHealth] = useState(user?.health_conditions || user?.health || []);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const steps = useMemo(
    () => [
      { label: "Profile", description: "Your visible travel profile." },
      { label: "Interests", description: "Pick what should shape your tours." },
      { label: "Health", description: "Help the planner avoid unsuitable stops." },
    ],
    [],
  );

  function updateProfile(event) {
    setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function saveCurrentStep(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (step === 0) {
        const updated = await updateCurrentUser(profile);
        setUser(updated);
      }

      if (step === 1) {
        const profileUser = user?.id ? user : await refreshUser();
        await updateUserInterests(profileUser.id, { interests });
      }

      if (step === 2) {
        const profileUser = user?.id ? user : await refreshUser();
        await updateUserHealth(profileUser.id, {
          conditions: health,
          notes,
        });
        await refreshUser();
        navigate("/generate", { replace: true });
        return;
      }

      setStep((current) => current + 1);
    } catch (apiError) {
      setError(apiError.response?.data?.detail || apiError.message || "Could not save this step.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page narrow-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Onboarding</p>
          <h1>{steps[step].label}</h1>
          <p className="helper-text">{steps[step].description}</p>
        </div>
      </div>

      <section className="panel form-stack">
        <div className="progress-track" aria-label={`Step ${step + 1} of ${steps.length}`}>
          <span style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        <form className="form-stack" onSubmit={saveCurrentStep}>
          {step === 0 ? (
            <>
              <div className="field">
                <label htmlFor="onboarding-name">Name</label>
                <input id="onboarding-name" name="name" onChange={updateProfile} required value={profile.name} />
              </div>
              <div className="field">
                <label htmlFor="avatar">Photo URL</label>
                <input
                  id="avatar"
                  name="avatar"
                  onChange={updateProfile}
                  placeholder="https://..."
                  type="url"
                  value={profile.avatar}
                />
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <div className="field">
              <span className="label">Interests</span>
              <ToggleChips options={interestOptions} selected={interests} onChange={setInterests} />
            </div>
          ) : null}

          {step === 2 ? (
            <>
              <p className="helper-text">
                These details are only used to make the route more comfortable and accessible.
              </p>
              <div className="field">
                <span className="label">Health considerations</span>
                <ToggleChips options={healthOptions} selected={health} onChange={setHealth} />
              </div>
              <div className="field">
                <label htmlFor="health-notes">Notes</label>
                <textarea id="health-notes" onChange={(event) => setNotes(event.target.value)} value={notes} />
              </div>
            </>
          ) : null}

          <div className="button-row">
            <button className="primary-button" disabled={saving} type="submit">
              {step === 2 ? "Finish" : "Continue"}
            </button>
            {step > 0 ? (
              <button className="ghost-button" disabled={saving} onClick={() => setStep((current) => current - 1)} type="button">
                Back
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </main>
  );
}
