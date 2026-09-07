export function OwnerBadge({
  name,
  color,
}: {
  name: string | null;
  color: string | null;
}) {
  if (!name) {
    return (
      <span className="font-mono text-xs italic text-muted">—</span>
    );
  }

  const badgeColor = color ?? "#6E6656";

  return (
    <span
      className="inline-block rounded-[2px] border px-2 py-1 font-mono text-[11px]"
      style={{
        color: badgeColor,
        borderColor: badgeColor,
        backgroundColor: `${badgeColor}24`,
      }}
    >
      {name}
    </span>
  );
}
