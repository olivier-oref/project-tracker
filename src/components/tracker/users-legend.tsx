import type { MemberInfo } from "@/components/tracker/note-block";

export function UsersLegend({ members }: { members: MemberInfo[] }) {
  if (members.length === 0) return null;

  return (
    <div className="legend">
      <span className="legend-label">Users:</span>
      {members.map((member) => (
        <span key={member.id}>
          <i style={{ background: member.color }} />
          {member.name}
        </span>
      ))}
    </div>
  );
}
