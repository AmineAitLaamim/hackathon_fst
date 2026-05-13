export default function GroupMembersPanel({ members = [] }) {
  if (!members.length) {
    return <div className="empty-state">No members listed.</div>;
  }

  return (
    <div className="member-list">
      {members.map((member) => (
        <div className="member-row" key={member.id || member.user_id}>
          <span className="avatar-dot">{(member.name || member.user?.name || "?").slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{member.name || member.user?.name || member.email || `User ${member.user_id || member.id}`}</strong>
            <p>{member.role || member.status || "member"}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
