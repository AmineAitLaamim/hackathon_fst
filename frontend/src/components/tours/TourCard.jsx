import { Link } from "react-router-dom";

function formatDate(value) {
  if (!value) {
    return "No date";
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export default function TourCard({ onDelete, onGroup, onShare, tour }) {
  return (
    <article className="tour-card">
      <div>
        <span className={`badge ${tour.status || "draft"}`}>{tour.status || "draft"}</span>
        <h2>{tour.title || tour.name || "Untitled tour"}</h2>
        <p className="helper-text">{tour.summary || tour.description || "Personal Marrakech itinerary"}</p>
      </div>
      <div className="meta-row">
        <span>{formatDate(tour.date || tour.created_at || tour.updated_at)}</span>
        <span>{tour.stops?.length || tour.stop_count || 0} stops</span>
      </div>
      <div className="tour-actions">
        <Link className="primary-button" to={`/tours/${tour.id}`}>
          Open
        </Link>
        <button className="secondary-button" onClick={() => onShare(tour)} type="button">
          Share
        </button>
        <button className="secondary-button" onClick={() => onGroup(tour)} type="button">
          Start group
        </button>
        <button className="danger-button" onClick={() => onDelete(tour)} type="button">
          Delete
        </button>
      </div>
    </article>
  );
}
