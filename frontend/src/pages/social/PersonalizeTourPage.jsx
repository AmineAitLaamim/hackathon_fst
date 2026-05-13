import { Check, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getApiError } from "../../api/client.js";
import { personalizeSharedTour } from "../../api/sharedTours.js";
import { deleteTour, updateTour } from "../../api/tours.js";

export default function PersonalizeTourPage() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    pace: "balanced",
    budget: "medium",
    accessibility: "",
    interests: "",
    notes: "",
  });
  const [draftTourId, setDraftTourId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handlePersonalize(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await personalizeSharedTour(shareId, form);
      setDraftTourId(data.tour_id || data.id);
    } catch (err) {
      setError(getApiError(err, "Unable to personalize this tour."));
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!draftTourId) return;
    setLoading(true);
    setError("");
    try {
      await updateTour(draftTourId, { status: "published" });
      navigate(`/tours/${draftTourId}`);
    } catch (err) {
      setError(getApiError(err, "Unable to publish personalized tour."));
    } finally {
      setLoading(false);
    }
  }

  async function handleDiscard() {
    if (!draftTourId || !window.confirm("Discard this personalized draft?")) return;
    setLoading(true);
    setError("");
    try {
      await deleteTour(draftTourId);
      setDraftTourId(null);
    } catch (err) {
      setError(getApiError(err, "Unable to discard personalized tour."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-stack narrow-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">AI personalization</p>
          <h1>Personalize shared tour</h1>
        </div>
      </header>

      {error && <div className="alert error">{error}</div>}

      <form className="panel form-grid" onSubmit={handlePersonalize}>
        <div className="form-two">
          <label>
            Pace
            <select value={form.pace} onChange={(event) => updateField("pace", event.target.value)}>
              <option value="relaxed">Relaxed</option>
              <option value="balanced">Balanced</option>
              <option value="intense">Packed</option>
            </select>
          </label>
          <label>
            Budget
            <select value={form.budget} onChange={(event) => updateField("budget", event.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="premium">Premium</option>
            </select>
          </label>
        </div>
        <label>
          Accessibility or health needs
          <input value={form.accessibility} onChange={(event) => updateField("accessibility", event.target.value)} />
        </label>
        <label>
          Interests
          <input value={form.interests} onChange={(event) => updateField("interests", event.target.value)} placeholder="food, souks, gardens" />
        </label>
        <label>
          Extra notes
          <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} rows="5" />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          <Sparkles size={17} aria-hidden="true" />
          {loading ? "Personalizing..." : "Create draft"}
        </button>
      </form>

      {loading && <div className="ai-loader">Building a personalized draft with your constraints...</div>}

      {draftTourId && (
        <div className="panel result-panel">
          <div>
            <p className="eyebrow">Draft ready</p>
            <h2>Tour #{draftTourId}</h2>
          </div>
          <div className="button-row">
            <button className="primary-button" type="button" onClick={handleConfirm} disabled={loading}>
              <Check size={17} aria-hidden="true" />
              Confirm publish
            </button>
            <button className="danger-button" type="button" onClick={handleDiscard} disabled={loading}>
              <Trash2 size={17} aria-hidden="true" />
              Discard
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
