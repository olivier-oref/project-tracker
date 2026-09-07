import type { MemberOption } from "@/components/tracker/editable-owner";

export function UsersLegend({ members }: { members: MemberOption[] }) {
  if (members.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-4" style={{ margin: "10px 0" }}>
      <span
        className="font-mono uppercase text-gold"
        style={{ fontSize: "9.5px", letterSpacing: "0.12em" }}
      >
        Users:
      </span>
      {members.map((member) => (
        <span key={member.id} className="flex items-center gap-1.5 font-mono text-[11px] text-ink">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ backgroundColor: member.color }}
          />
          {member.name}
        </span>
      ))}
    </div>
  );
}
