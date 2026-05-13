import { CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { getApiError } from "../../api/client.js";
import { getNotifications, markNotificationRead } from "../../api/notifications.js";

function normalize(payload) {
  if (Array.isArray(payload)) return { results: payload, next: null, previous: null };
  return { results: payload?.results || payload?.items || [], next: payload?.next || null, previous: payload?.previous || null };
}

function typeLabel(type) {
  const labels = {
    friend_request: "Friend request",
    tour_invitation: "Tour invitation",
    group_checkin: "Group check-in",
  };
  return labels[type] || type || "Notification";
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [payload, setPayload] = useState({ results: [], next: null, previous: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData(targetPage = page) {
    setLoading(true);
    setError("");
    try {
      setPayload(normalize(await getNotifications(targetPage)));
    } catch (err) {
      setError(getApiError(err, "Unable to load notifications."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(page);
  }, [page]);

  async function handleRead(id) {
    setError("");
    try {
      await markNotificationRead(id);
      await loadData(page);
    } catch (err) {
      setError(getApiError(err, "Unable to mark notification as read."));
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Updates</p>
          <h1>Notifications</h1>
        </div>
      </header>

      {error && <div className="alert error">{error}</div>}
      {loading && <div className="loading-line">Loading notifications...</div>}

      <div className="list-panel">
        {!loading && payload.results.length === 0 && <div className="empty-state">No notifications yet.</div>}
        {payload.results.map((notification) => (
          <article className={`list-row ${notification.read_at || notification.is_read ? "" : "unread"}`} key={notification.id}>
            <div>
              <p className="eyebrow">{typeLabel(notification.type)}</p>
              <h2>{notification.title || notification.message || "Notification"}</h2>
              {notification.message && notification.title && <p className="muted">{notification.message}</p>}
            </div>
            <button className="secondary-button" type="button" onClick={() => handleRead(notification.id)}>
              <CheckCheck size={17} aria-hidden="true" />
              Mark read
            </button>
          </article>
        ))}
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
