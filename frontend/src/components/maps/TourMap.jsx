import { MapPin } from "lucide-react";

export default function TourMap({ stops = [], title = "Tour map" }) {
  return (
    <div className="map-placeholder" role="img" aria-label={title}>
      <div className="map-canvas">
        {stops.slice(0, 8).map((stop, index) => (
          <span
            className="map-pin"
            key={stop.id || stop.place_id || index}
            style={{
              left: `${18 + ((index * 19) % 64)}%`,
              top: `${22 + ((index * 23) % 52)}%`,
            }}
          >
            {index + 1}
          </span>
        ))}
        <MapPin size={34} aria-hidden="true" />
      </div>
    </div>
  );
}
