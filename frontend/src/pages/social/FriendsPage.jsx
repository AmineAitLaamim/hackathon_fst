import { Check, Send, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getApiError } from "../../api/client.js";
import {
  getFriendRequests,
  getFriends,
  removeFriend,
  respondToFriendRequest,
  sendFriendRequest,
} from "../../api/friends.js";

function listFrom(payload) {
  return Array.isArray(payload) ? payload : payload?.results || payload?.items || [];
}

function displayUser(item) {
  const user = item.friend || item.user || item.sender || item.receiver || item.to_user || item.from_user || item;
  return user.name || user.email || user.username || `User ${user.id || item.user_id || item.id}`;
}

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState("friends");
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [friendsData, incomingData, outgoingData] = await Promise.all([
        getFriends(),
        getFriendRequests("incoming"),
        getFriendRequests("outgoing"),
      ]);
      setFriends(listFrom(friendsData));
      setIncoming(listFrom(incomingData));
      setOutgoing(listFrom(outgoingData));
    } catch (err) {
      setError(getApiError(err, "Unable to load friends."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const tabData = useMemo(
    () => ({
      friends,
      incoming,
      outgoing,
    }),
    [friends, incoming, outgoing],
  );

  async function handleRequest(event) {
    event.preventDefault();
    if (!userId.trim()) return;
    setError("");
    try {
      await sendFriendRequest(userId.trim());
      setUserId("");
      await loadData();
    } catch (err) {
      setError(getApiError(err, "Unable to send friend request."));
    }
  }

  async function handleRespond(id, status) {
    setError("");
    try {
      await respondToFriendRequest(id, status);
      await loadData();
    } catch (err) {
      setError(getApiError(err, "Unable to update request."));
    }
  }

  async function handleRemove(id) {
    if (!window.confirm("Remove this friend?")) return;
    setError("");
    try {
      await removeFriend(id);
      await loadData();
    } catch (err) {
      setError(getApiError(err, "Unable to remove friend."));
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Social</p>
          <h1>Friends</h1>
        </div>
        <form className="inline-form" onSubmit={handleRequest}>
          <input value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="User ID" />
          <button className="primary-button" type="submit">
            <Send size={17} aria-hidden="true" />
            Request
          </button>
        </form>
      </header>

      {error && <div className="alert error">{error}</div>}
      {loading && <div className="loading-line">Loading friends...</div>}

      <div className="segmented-control">
        {[
          ["friends", "Accepted"],
          ["incoming", "Incoming"],
          ["outgoing", "Outgoing"],
        ].map(([key, label]) => (
          <button key={key} className={activeTab === key ? "active" : ""} type="button" onClick={() => setActiveTab(key)}>
            {label}
          </button>
        ))}
      </div>

      <div className="list-panel">
        {tabData[activeTab].length === 0 && !loading ? <div className="empty-state">Nothing to show here.</div> : null}
        {tabData[activeTab].map((item) => (
          <article className="list-row" key={item.id}>
            <div>
              <h2>{displayUser(item)}</h2>
              <p className="muted">{item.status || activeTab}</p>
            </div>
            <div className="button-row">
              {activeTab === "incoming" && (
                <>
                  <button className="icon-button" type="button" onClick={() => handleRespond(item.id, "accepted")} aria-label="Accept request">
                    <Check size={17} />
                  </button>
                  <button className="icon-button danger-button" type="button" onClick={() => handleRespond(item.id, "declined")} aria-label="Decline request">
                    <X size={17} />
                  </button>
                </>
              )}
              {activeTab === "friends" && (
                <button className="icon-button danger-button" type="button" onClick={() => handleRemove(item.id)} aria-label="Remove friend">
                  <Trash2 size={17} />
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
