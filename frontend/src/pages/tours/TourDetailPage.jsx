import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createGroupTour } from "../../api/groupTours.js";
import {
  deleteTour,
  getTour,
  publishTour,
  shareTourWithFriends,
  unpublishTour,
  updateTourShare,
} from "../../api/tours.js";
import TourMap from "../../components/maps/TourMap.jsx";
import TourStopsList from "../../components/tours/TourStopsList.jsx";
import { useAuth } from "../../features/auth/useAuth.js";

export default function TourDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [tour, setTour] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTour(id)
      .then(setTour)
      .catch((apiError) => setError(apiError.response?.data?.detail || "Could not load tour."))
      .finally(() => setLoading(false));
  }, [id]);

  const stops = useMemo(() => tour?.stops || tour?.stop_details || [], [tour]);
  const isAuthor = !tour || !tour.author_id || !user?.id || tour.author_id === user.id || tour.owner_id === user.id;

  async function handleDelete() {
    if (!window.confirm(`Delete "${tour.title || tour.name || "this tour"}"?`)) {
      return;
    }
    await deleteTour(tour.id);
    navigate("/tours", { replace: true });
  }

  async function handlePublish() {
    const updated = await publishTour(tour.id);
    setTour((current) => ({ ...current, ...updated, status: updated.status || "published" }));
  }

  async function handleUpdateShare() {
    const visibility = window.prompt("Share visibility", tour.share_visibility || "public");
    if (!visibility) {
      return;
    }
    const updated = await updateTourShare(tour.id, { visibility });
    setTour((current) => ({ ...current, ...updated }));
  }

  async function handleUnpublish() {
    await unpublishTour(tour.id);
    setTour((current) => ({ ...current, status: "draft" }));
  }

  async function handleShareWithFriends() {
    const value = window.prompt("Friend IDs, comma separated");
    if (!value) {
      return;
    }
    const friendIds = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    await shareTourWithFriends(tour.id, friendIds);
  }

  async function handleStartGroup() {
    const session = await createGroupTour(tour.id);
    navigate(`/group/${session.id || session.group_id}`);
  }

  if (loading) {
    return <main className="page">Loading tour...</main>;
  }

  if (error || !tour) {
    return (
      <main className="page">
        <div className="error-box">{error || "Tour not found."}</div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{tour.status || "draft"}</p>
          <h1>{tour.title || tour.name || "Untitled tour"}</h1>
          <p className="helper-text">{tour.summary || tour.description}</p>
        </div>
        <button className="primary-button" onClick={handleStartGroup} type="button">
          Start group session
        </button>
      </div>

      <section className="tour-detail-layout">
        <div className="map-panel">
          <TourMap stops={stops} />
        </div>
        <aside className="panel form-stack">
          <h2>Stops</h2>
          <TourStopsList stops={stops} />
        </aside>
      </section>

      {isAuthor ? (
        <section className="panel author-actions">
          <h2>Author actions</h2>
          <div className="button-row">
            <button className="secondary-button" type="button">
              Edit
            </button>
            <button className="secondary-button" onClick={handlePublish} type="button">
              Share publicly
            </button>
            <button className="secondary-button" onClick={handleUpdateShare} type="button">
              Modify share
            </button>
            <button className="secondary-button" onClick={handleUnpublish} type="button">
              Unpublish
            </button>
            <button className="secondary-button" onClick={handleShareWithFriends} type="button">
              Share with friends
            </button>
            <button className="danger-button" onClick={handleDelete} type="button">
              Delete
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
