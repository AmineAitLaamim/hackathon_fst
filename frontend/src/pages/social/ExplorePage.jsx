import { Star, MapPin, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getApiError } from "../../api/client.js";
import { getSharedTours } from "../../api/sharedTours.js";

function normalizeList(payload) {
  if (Array.isArray(payload)) return { results: payload, next: null, previous: null };
  return {
    results: payload?.results || payload?.items || [],
    next: payload?.next || null,
    previous: payload?.previous || null,
  };
}

function getStopCount(tour) {
  return tour.stop_count ?? tour.stops_count ?? tour.stops?.length ?? 0;
}

function getAuthor(tour) {
  return tour.author?.name || tour.author_name || tour.user?.name || "Local guide";
}

function getRating(tour) {
  const rating = tour.average_rating ?? tour.avg_rating ?? tour.rating;
  return Number.isFinite(Number(rating)) ? Number(rating).toFixed(1) : "New";
}

export default function ExplorePage() {
  const [sort, setSort] = useState("rating");
  const [page, setPage] = useState(1);
  const [payload, setPayload] = useState({ results: [], next: null, previous: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getSharedTours({ sort, page })
      .then((data) => {
        if (!cancelled) setPayload(normalizeList(data));
      })
      .catch((err) => {
        if (!cancelled) setError(getApiError(err, "Unable to load public tours."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sort, page]);

  const tours = useMemo(() => payload.results, [payload]);

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Public tours</p>
          <h1>Explore Marrakech tours</h1>
        </div>
        <div className="segmented-control" aria-label="Sort tours">
          {["rating", "recent"].map((option) => (
            <button
              key={option}
              className={sort === option ? "active" : ""}
              type="button"
              onClick={() => {
                setSort(option);
                setPage(1);
              }}
            >
              {option === "rating" ? "Top rated" : "Recent"}
            </button>
          ))}
        </div>
      </header>

      {error && <div className="alert error">{error}</div>}
      {loading && <div className="loading-line">Loading shared tours...</div>}

      {!loading && !error && tours.length === 0 && (
        <div className="empty-state">No public tours are available yet.</div>
      )}

      <div className="tour-grid">
        {tours.map((tour) => {
          const shareId = tour.share_id || tour.shareId || tour.id;
          return (
            <Link className="tour-card" to={`/explore/${shareId}`} key={shareId}>
              <div className="tour-card-map">
                <MapPin size={26} aria-hidden="true" />
              </div>
              <div className="tour-card-body">
                <h2>{tour.name || tour.title || "Untitled tour"}</h2>
                <p className="muted">
                  <UserRound size={15} aria-hidden="true" />
                  {getAuthor(tour)}
                </p>
                <div className="meta-row">
                  <span>
                    <Star size={15} aria-hidden="true" />
                    {getRating(tour)}
                  </span>
                  <span>{getStopCount(tour)} stops</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <footer className="pager">
        <button type="button" disabled={!payload.previous || page <= 1} onClick={() => setPage((value) => value - 1)}>
          Previous
        </button>
        <span>Page {page}</span>
        <button type="button" disabled={!payload.next} onClick={() => setPage((value) => value + 1)}>
          Next
        </button>
      </footer>
    </section>
  );
}
