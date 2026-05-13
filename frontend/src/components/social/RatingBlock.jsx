import { Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createSharedTourRating,
  deleteSharedTourRating,
  getMySharedTourRating,
  updateSharedTourRating,
} from "../../api/sharedTours.js";
import { getApiError } from "../../api/client.js";

export default function RatingBlock({ shareId }) {
  const [existingRating, setExistingRating] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getMySharedTourRating(shareId)
      .then((data) => {
        if (cancelled) return;
        setExistingRating(data);
        setRating(data.rating || data.score || 5);
        setComment(data.comment || "");
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.response?.status === 404) {
          setExistingRating(null);
          setRating(5);
          setComment("");
        } else {
          setError(getApiError(err, "Unable to load your rating."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shareId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = { rating: Number(rating), comment };
    try {
      const data = existingRating
        ? await updateSharedTourRating(shareId, payload)
        : await createSharedTourRating(shareId, payload);
      setExistingRating(data);
    } catch (err) {
      setError(getApiError(err, "Unable to save your rating."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete your rating?")) return;
    setSaving(true);
    setError("");
    try {
      await deleteSharedTourRating(shareId);
      setExistingRating(null);
      setRating(5);
      setComment("");
    } catch (err) {
      setError(getApiError(err, "Unable to delete your rating."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="panel">Loading your rating...</div>;

  return (
    <section className="panel rating-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Your rating</p>
          <h2>{existingRating ? "Update this tour" : "Rate this tour"}</h2>
        </div>
        {existingRating && (
          <button className="icon-button danger-button" type="button" onClick={handleDelete} disabled={saving} aria-label="Delete rating">
            <Trash2 size={17} />
          </button>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Score
          <select value={rating} onChange={(event) => setRating(event.target.value)}>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} stars
              </option>
            ))}
          </select>
        </label>
        <label>
          Comment
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows="4" />
        </label>
        <button className="primary-button" type="submit" disabled={saving}>
          <Star size={17} aria-hidden="true" />
          {existingRating ? "Update rating" : "Submit rating"}
        </button>
      </form>
    </section>
  );
}
