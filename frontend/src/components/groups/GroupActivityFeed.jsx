import { Trash2 } from "lucide-react";

export default function GroupActivityFeed({ activities = [], onDeleteComment }) {
  if (!activities.length) {
    return <div className="empty-state">No activity yet.</div>;
  }

  return (
    <div className="activity-feed">
      {activities.map((item, index) => (
        <article className="activity-item" key={item.id || index}>
          <div>
            <strong>{item.user?.name || item.actor_name || "Member"}</strong>
            <p>{item.text || item.message || item.type || "Activity"}</p>
          </div>
          {item.comment_id && item.stop_id && (
            <button
              className="icon-button danger-button"
              type="button"
              onClick={() => onDeleteComment(item.stop_id, item.comment_id)}
              aria-label="Delete comment"
            >
              <Trash2 size={15} />
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
