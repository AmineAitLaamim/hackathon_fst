import { LogIn, LogOut, MessageSquare, Radio, Send, Trash2, UserPlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getApiError } from "../../api/client.js";
import {
  checkInStop,
  deleteGroupTour,
  deleteStopComment,
  getGroupTour,
  getGroupTourActivity,
  inviteToGroupTour,
  joinGroupTour,
  leaveGroupTour,
  postStopComment,
} from "../../api/groupTours.js";
import GroupActivityFeed from "../../components/groups/GroupActivityFeed.jsx";
import GroupMembersPanel from "../../components/groups/GroupMembersPanel.jsx";
import GroupTourMap from "../../components/maps/GroupTourMap.jsx";

function listFrom(payload) {
  return Array.isArray(payload) ? payload : payload?.results || payload?.items || [];
}

export default function GroupSessionPage() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [activity, setActivity] = useState([]);
  const [activeTab, setActiveTab] = useState("map");
  const [friendIds, setFriendIds] = useState("");
  const [comment, setComment] = useState("");
  const [selectedStopId, setSelectedStopId] = useState("");
  const [error, setError] = useState("");
  const lastActivityAt = useRef("");

  const loadSession = useCallback(async () => {
    const data = await getGroupTour(id);
    setSession(data);
    const firstStop = data?.tour?.stops?.[0]?.id || data?.stops?.[0]?.id || "";
    setSelectedStopId((current) => current || firstStop);
  }, [id]);

  const loadActivity = useCallback(async () => {
    const data = await getGroupTourActivity(id);
    const marker = data?.last_activity_at || data?.updated_at || JSON.stringify(data).length;
    if (String(marker) !== String(lastActivityAt.current)) {
      lastActivityAt.current = marker;
      setActivity(listFrom(data));
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setError("");
    Promise.all([loadSession(), loadActivity()]).catch((err) => {
      if (!cancelled) setError(getApiError(err, "Unable to load group session."));
    });
    const interval = window.setInterval(() => {
      loadActivity().catch(() => {});
    }, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [loadActivity, loadSession]);

  const stops = useMemo(() => session?.tour?.stops || session?.stops || [], [session]);
  const members = session?.members || [];

  async function runAction(action, message) {
    setError("");
    try {
      await action();
      await Promise.all([loadSession(), loadActivity()]);
    } catch (err) {
      setError(getApiError(err, message));
    }
  }

  function handleInvite(event) {
    event.preventDefault();
    const ids = friendIds.split(",").map((value) => value.trim()).filter(Boolean);
    if (!ids.length) return;
    runAction(() => inviteToGroupTour(id, ids), "Unable to invite friends.").then(() => setFriendIds(""));
  }

  function handleComment(event) {
    event.preventDefault();
    if (!selectedStopId || !comment.trim()) return;
    runAction(() => postStopComment(id, selectedStopId, comment.trim()), "Unable to post comment.").then(() => setComment(""));
  }

  if (!session && !error) return <div className="loading-line">Loading live session...</div>;

  return (
    <section className="page-stack live-page">
      <header className="page-header">
        <div>
          <p className="live-indicator"><Radio size={15} aria-hidden="true" /> Live</p>
          <h1>{session?.tour?.name || session?.name || `Group ${id}`}</h1>
        </div>
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={() => runAction(() => joinGroupTour(id), "Unable to join session.")}>
            <LogIn size={17} aria-hidden="true" />
            Join
          </button>
          <button className="secondary-button" type="button" onClick={() => runAction(() => leaveGroupTour(id), "Unable to leave session.")}>
            <LogOut size={17} aria-hidden="true" />
            Leave
          </button>
          <button
            className="danger-button"
            type="button"
            onClick={() => window.confirm("Disband this group session?") && runAction(() => deleteGroupTour(id), "Unable to disband session.")}
          >
            <Trash2 size={17} aria-hidden="true" />
            Disband
          </button>
        </div>
      </header>

      {error && <div className="alert error">{error}</div>}

      <div className="mobile-tabs segmented-control">
        {["map", "activity", "members"].map((tab) => (
          <button className={activeTab === tab ? "active" : ""} key={tab} type="button" onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      <div className="live-grid">
        <div className={`live-map ${activeTab === "map" ? "mobile-active" : ""}`}>
          <GroupTourMap session={session} />
        </div>
        <aside className="live-sidebar">
          <div className={`panel ${activeTab === "members" ? "mobile-active" : ""}`}>
            <div className="panel-heading">
              <h2>Members</h2>
            </div>
            <GroupMembersPanel members={members} />
            <form className="inline-form stack-mobile" onSubmit={handleInvite}>
              <input value={friendIds} onChange={(event) => setFriendIds(event.target.value)} placeholder="Friend ids, comma separated" />
              <button className="icon-button" type="submit" aria-label="Invite friends">
                <UserPlus size={17} />
              </button>
            </form>
          </div>

          <div className={`panel ${activeTab === "activity" ? "mobile-active" : ""}`}>
            <div className="panel-heading">
              <h2>Activity</h2>
            </div>
            <GroupActivityFeed
              activities={activity}
              onDeleteComment={(stopId, commentId) => runAction(() => deleteStopComment(id, stopId, commentId), "Unable to delete comment.")}
            />
          </div>

          <form className={`panel form-grid ${activeTab === "activity" ? "mobile-active" : ""}`} onSubmit={handleComment}>
            <label>
              Stop
              <select value={selectedStopId} onChange={(event) => setSelectedStopId(event.target.value)}>
                {stops.map((stop, index) => (
                  <option value={stop.id || stop.stop_id} key={stop.id || stop.stop_id || index}>
                    {stop.name || `Stop ${index + 1}`}
                  </option>
                ))}
              </select>
            </label>
            <div className="button-row">
              <button className="secondary-button" type="button" onClick={() => runAction(() => checkInStop(id, selectedStopId), "Unable to check in.")}>
                <Radio size={17} aria-hidden="true" />
                Check in
              </button>
            </div>
            <label>
              Comment
              <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows="3" />
            </label>
            <button className="primary-button" type="submit">
              <Send size={17} aria-hidden="true" />
              Post comment
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
}
