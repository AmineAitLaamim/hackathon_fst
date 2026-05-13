import TourMap from "./TourMap.jsx";

export default function GroupTourMap({ session }) {
  const stops = session?.tour?.stops || session?.stops || [];
  return <TourMap stops={stops} title={`${session?.tour?.name || "Group tour"} live map`} />;
}
