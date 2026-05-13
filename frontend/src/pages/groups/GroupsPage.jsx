import { MapPinned, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApiError } from "../../api/client.js";
import { createGroupTour, getGroupTours } from "../../api/groupTours.js";

function listFrom(payload) {
  return Array.isArray(payload) ? payload : payload?.results || payload?.items || [];
}

function isActive(session) {
  const status = String(session.status || "").toLowerCase();
  return status === "active" || status === "en cours" || status === "in_progress";
}

export default function GroupsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [tourId, setTourId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getGroupTours()
      .then((data) => {
        if (!cancelled) setSessions(listFrom(data));
      })
      .catch((err) => {
        if (!cancelled) setError(getApiError(err, "Unable to load group sessions."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeSession = useMemo(() => sessions.find(isActive), [sessions]);

  async function handleCreate(event) {
    event.preventDefault();
    if (!tourId.trim()) return;
    setError("");
    try {
      const session = await createGroupTour(tourId.trim());
      navigate(`/group/${session.id || session.group_id}`);
    } catch (err) {
      setError(getApiError(err, "Unable to create group session."));
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Live tours</p>
          <h1>Group sessions</h1>
        </div>
        <form className="inline-form" onSubmit={handleCreate}>
          <input value={tourId} onChange={(event) => setTourId(event.target.value)} placeholder="Tour ID" />
          <button className="primary-button" type="submit">
            <Plus size={17} aria-hidden="true" />
            Create
          </button>
        </form>
      </header>

      {error && <div className="alert error">{error}</div>}
      {activeSession && (
        <Link className="active-session-banner" to={`/group/${activeSession.id}`}>
          <MapPinned size={19} aria-hidden="true" />
          Continue active session: {activeSession.name || activeSession.tour?.name || `Group ${activeSession.id}`}
        </Link>
      )}
      {loading && <div className="loading-line">Loading group sessions...</div>}

      <div className="card-list">
        {!loading && sessions.length === 0 && <div className="empty-state">No group sessions yet.</div>}
        {sessions.map((session) => (
          <Link className="preview-card" to={`/group/${session.id}`} key={session.id}>
            <div>
              <p className="eyebrow">{isActive(session) ? "en cours" : "termine"}</p>
              <h2>{session.name || session.tour?.name || `Group session ${session.id}`}</h2>
              <p className="muted">{session.members?.length ?? session.member_count ?? 0} members</p>
            </div>
            <span className={isActive(session) ? "status-pill live" : "status-pill"}>{isActive(session) ? "Active" : "Ended"}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
