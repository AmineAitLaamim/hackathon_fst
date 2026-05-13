import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createGroupTour } from "../../api/groupTours.js";
import { deleteTour, listTours, publishTour } from "../../api/tours.js";
import TourCard from "../../components/tours/TourCard.jsx";

function normalizeList(data) {
  return Array.isArray(data) ? data : data.results || data.tours || [];
}

export default function ToursPage() {
  const navigate = useNavigate();
  const [tours, setTours] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTours()
      .then((data) => setTours(normalizeList(data)))
      .catch((apiError) => setError(apiError.response?.data?.detail || "Could not load tours."))
      .finally(() => setLoading(false));
  }, []);

  const sortedTours = useMemo(
    () =>
      [...tours].sort(
        (a, b) =>
          new Date(b.date || b.created_at || b.updated_at || 0) -
          new Date(a.date || a.created_at || a.updated_at || 0),
      ),
    [tours],
  );

  async function handleDelete(tour) {
    if (!window.confirm(`Delete "${tour.title || tour.name || "this tour"}"?`)) {
      return;
    }
    await deleteTour(tour.id);
    setTours((current) => current.filter((item) => item.id !== tour.id));
  }

  async function handleShare(tour) {
    const updated = await publishTour(tour.id);
    setTours((current) =>
      current.map((item) => (item.id === tour.id ? { ...item, ...updated, status: updated.status || "published" } : item)),
    );
  }

  async function handleGroup(tour) {
    const session = await createGroupTour(tour.id);
    navigate(`/group/${session.id || session.group_id}`);
  }

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Tours</p>
          <h1>Your tours</h1>
        </div>
        <Link className="primary-button" to="/generate">
          Generate
        </Link>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {loading ? <p className="helper-text">Loading tours...</p> : null}
      {!loading && !sortedTours.length ? (
        <section className="panel empty-state">
          <h2>No tours yet</h2>
          <p className="helper-text">Generate your first Marrakech route to see it here.</p>
          <Link className="primary-button" to="/generate">
            Generate tour
          </Link>
        </section>
      ) : null}

      <section className="tour-grid">
        {sortedTours.map((tour) => (
          <TourCard
            key={tour.id}
            onDelete={handleDelete}
            onGroup={handleGroup}
            onShare={handleShare}
            tour={tour}
          />
        ))}
      </section>
    </main>
  );
}
