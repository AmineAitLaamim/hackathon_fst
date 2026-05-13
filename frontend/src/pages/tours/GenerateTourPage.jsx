import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateTour } from "../../api/tours.js";

const loaderMessages = [
  "Reading your profile...",
  "Balancing distance, budget, and timing...",
  "Checking health and comfort constraints...",
  "Drafting your Marrakech route...",
];

export default function GenerateTourPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ duration: "1 day", budget: "medium", themes: "", notes: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!loading) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % loaderMessages.length);
    }, 1500);
    return () => window.clearInterval(timer);
  }, [loading]);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    setMessageIndex(0);

    try {
      const data = await generateTour({
        ...form,
        themes: form.themes
          .split(",")
          .map((theme) => theme.trim())
          .filter(Boolean),
      });
      const tourId = data.id || data.tour_id || data.tour?.id;
      if (!tourId) {
        throw new Error("The generated tour response did not include a tour id.");
      }
      navigate(`/tours/${tourId}`);
    } catch (apiError) {
      setError(apiError.response?.data?.detail || apiError.message || "Tour generation failed.");
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="ai-loader">
        <div className="loader-mark" />
        <p className="eyebrow">AI planner</p>
        <h1>{loaderMessages[messageIndex]}</h1>
      </main>
    );
  }

  return (
    <main className="page narrow-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Generate</p>
          <h1>Create a tour</h1>
          <p className="helper-text">Describe the day you want and let the planner produce a draft route.</p>
        </div>
      </div>

      <form className="panel form-stack" onSubmit={handleSubmit}>
        {error ? <div className="error-box">{error}</div> : null}
        <div className="field-row two-columns">
          <div className="field">
            <label htmlFor="duration">Duration</label>
            <select id="duration" name="duration" onChange={updateField} value={form.duration}>
              <option>Half day</option>
              <option>1 day</option>
              <option>2 days</option>
              <option>3 days</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="budget">Budget</label>
            <select id="budget" name="budget" onChange={updateField} value={form.budget}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="themes">Themes</label>
          <input
            id="themes"
            name="themes"
            onChange={updateField}
            placeholder="food, souks, gardens"
            value={form.themes}
          />
        </div>
        <div className="field">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            onChange={updateField}
            placeholder="Start late, avoid crowded alleys, include a rooftop lunch..."
            value={form.notes}
          />
        </div>
        <button className="primary-button" type="submit">
          Generate tour
        </button>
      </form>
    </main>
  );
}
