import { CopyPlus, Sparkles, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getApiError } from "../../api/client.js";
import { cloneSharedTour, getSharedTour } from "../../api/sharedTours.js";
import TourMap from "../../components/maps/TourMap.jsx";
import RatingBlock from "../../components/social/RatingBlock.jsx";
import TourStopsList from "../../components/tours/TourStopsList.jsx";

export default function ExploreDetailPage() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getSharedTour(shareId)
      .then((data) => {
        if (!cancelled) setTour(data);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiError(err, "Unable to load this shared tour."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shareId]);

  async function handleClone() {
    setBusy(true);
    setError("");
    try {
      const data = await cloneSharedTour(shareId);
      const tourId = data.tour_id || data.id;
      if (tourId) navigate(`/tours/${tourId}`);
    } catch (err) {
      setError(getApiError(err, "Unable to clone this tour."));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="loading-line">Loading shared tour...</div>;
  if (error && !tour) return <div className="alert error">{error}</div>;

  const stops = tour?.stops || tour?.tour?.stops || [];
  const rating = tour?.average_rating ?? tour?.avg_rating ?? tour?.rating;

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Shared tour</p>
          <h1>{tour?.name || tour?.title || "Marrakech tour"}</h1>
          <p className="inline-meta">
            <Star size={16} aria-hidden="true" />
            {rating ? Number(rating).toFixed(1) : "No ratings yet"}
          </p>
        </div>
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={handleClone} disabled={busy}>
            <CopyPlus size={17} aria-hidden="true" />
            Clone
          </button>
          <Link className="primary-button" to={`/tours/personalize/${shareId}`}>
            <Sparkles size={17} aria-hidden="true" />
            Personalize
          </Link>
        </div>
      </header>

      {error && <div className="alert error">{error}</div>}

      <div className="detail-grid">
        <TourMap stops={stops} title={`${tour?.name || "Tour"} map`} />
        <div className="panel">
          <h2>Stops</h2>
          <TourStopsList stops={stops} />
        </div>
      </div>

      <RatingBlock shareId={shareId} />
    </section>
  );
}
