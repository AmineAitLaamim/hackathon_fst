import { Clock, Footprints, MapPin } from "lucide-react";

export default function TourStopsList({ stops = [] }) {
  if (!stops.length) {
    return <div className="empty-state">No stops have been added to this tour.</div>;
  }

  return (
    <ol className="stop-list">
      {stops.map((stop, index) => (
        <li className="stop-item" key={stop.id || stop.place_id || index}>
          <span className="stop-index">{index + 1}</span>
          <div>
            <h3>{stop.name || stop.title || `Stop ${index + 1}`}</h3>
            <div className="stop-meta">
              {stop.schedule || stop.time ? (
                <span>
                  <Clock size={14} aria-hidden="true" />
                  {stop.schedule || stop.time}
                </span>
              ) : null}
              {stop.walking_distance || stop.distance ? (
                <span>
                  <Footprints size={14} aria-hidden="true" />
                  {stop.walking_distance || stop.distance}
                </span>
              ) : null}
              {stop.address ? (
                <span>
                  <MapPin size={14} aria-hidden="true" />
                  {stop.address}
                </span>
              ) : null}
            </div>
            {stop.description && <p>{stop.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
