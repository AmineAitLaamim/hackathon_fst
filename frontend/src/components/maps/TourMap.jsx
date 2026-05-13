import { useEffect, useMemo, useRef, useState } from "react";

function readLatLng(stop) {
  const lat = Number(stop.lat ?? stop.latitude ?? stop.location?.lat);
  const lng = Number(stop.lng ?? stop.longitude ?? stop.location?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function loadGoogleMaps(apiKey) {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  const existingScript = document.querySelector("script[data-google-maps]");
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(window.google.maps), { once: true });
      existingScript.addEventListener("error", reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";
    script.addEventListener("load", () => resolve(window.google.maps), { once: true });
    script.addEventListener("error", reject, { once: true });
    document.head.appendChild(script);
  });
}

export default function TourMap({ stops = [] }) {
  const mapRef = useRef(null);
  const [mapError, setMapError] = useState("");
  const points = useMemo(() => stops.map(readLatLng).filter(Boolean), [stops]);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || !points.length || !mapRef.current) {
      return undefined;
    }

    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (cancelled) {
          return;
        }
        const map = new maps.Map(mapRef.current, {
          center: points[0],
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
        });
        const bounds = new maps.LatLngBounds();
        points.forEach((point, index) => {
          bounds.extend(point);
          new maps.Marker({
            label: String(index + 1),
            map,
            position: point,
          });
        });
        if (points.length > 1) {
          map.fitBounds(bounds);
        }
      })
      .catch(() => setMapError("Google Maps could not be loaded."));

    return () => {
      cancelled = true;
    };
  }, [apiKey, points]);

  if (!apiKey || !points.length || mapError) {
    return (
      <div className="map-fallback">
        <p>{mapError || "Map preview"}</p>
        <span>{points.length ? `${points.length} mapped stops` : "No stop coordinates provided"}</span>
      </div>
    );
  }

  return <div className="map-canvas" ref={mapRef} />;
}
