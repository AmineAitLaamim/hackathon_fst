export default function TourStopsList({ stops = [] }) {
  if (!stops.length) {
    return <p className="helper-text">No stops are embedded in this tour yet.</p>;
  }

  return (
    <ol className="stop-list">
      {stops.map((stop, index) => (
        <li key={stop.id || `${stop.name}-${index}`}>
          <span className="stop-index">{index + 1}</span>
          <div>
            <h3>{stop.name || stop.title || `Stop ${index + 1}`}</h3>
            <p>{stop.schedule || stop.time || stop.arrival_time || "Flexible time"}</p>
            <p className="helper-text">
              {stop.walking_distance || stop.distance || stop.walkingDistance || "Walking distance not specified"}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
