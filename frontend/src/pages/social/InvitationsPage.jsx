import { Check, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getApiError } from "../../api/client.js";
import { getInvitations, updateInvitation } from "../../api/invitations.js";
import { getSharedWithMeTours } from "../../api/tours.js";

function listFrom(payload) {
  return Array.isArray(payload) ? payload : payload?.results || payload?.items || [];
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState([]);
  const [sharedTours, setSharedTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [invitationData, toursData] = await Promise.all([getInvitations(), getSharedWithMeTours()]);
      setInvitations(listFrom(invitationData));
      setSharedTours(listFrom(toursData));
    } catch (err) {
      setError(getApiError(err, "Unable to load invitations."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const cards = useMemo(() => {
    const toursById = new Map(sharedTours.map((tour) => [String(tour.tour_id || tour.id), tour]));
    return invitations.map((invite) => {
      const tourId = String(invite.tour_id || invite.tour?.id || invite.tour);
      return {
        invite,
        tour: toursById.get(tourId) || invite.tour || null,
        tourId,
      };
    });
  }, [invitations, sharedTours]);

  async function respond(inviteId, status) {
    setError("");
    try {
      await updateInvitation(inviteId, status);
      await loadData();
    } catch (err) {
      setError(getApiError(err, "Unable to update invitation."));
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Private shares</p>
          <h1>Invitations</h1>
        </div>
      </header>

      {error && <div className="alert error">{error}</div>}
      {loading && <div className="loading-line">Loading invitations...</div>}

      <div className="card-list">
        {!loading && cards.length === 0 && <div className="empty-state">No pending invitations.</div>}
        {cards.map(({ invite, tour, tourId }) => (
          <article className="preview-card" key={invite.id}>
            <div>
              <p className="eyebrow">Tour #{tourId}</p>
              <h2>{tour?.name || tour?.title || "Shared tour"}</h2>
              <p className="muted">From {invite.sender?.name || invite.from_user?.name || invite.sharing_friend || "a friend"}</p>
              {tour?.description && <p>{tour.description}</p>}
            </div>
            <div className="button-row">
              <button className="primary-button" type="button" onClick={() => respond(invite.id, "accepted")}>
                <Check size={17} aria-hidden="true" />
                Accept
              </button>
              <button className="danger-button" type="button" onClick={() => respond(invite.id, "declined")}>
                <X size={17} aria-hidden="true" />
                Decline
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
