export function DueDateBadge({ date }: { date: string | null }) {
  if (!date) {
    return (
      <span
        className="inline-block rounded-[2px] border border-dashed border-rust px-2 py-1 font-mono text-[10.5px] text-rust"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(154,74,50,0.07) 0 6px, rgba(154,74,50,0.13) 6px 12px)",
        }}
      >
        NO DATE
      </span>
    );
  }

  const formatted = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));

  return (
    <span className="inline-block rounded-[2px] border border-line bg-paper-2 px-2 py-1 font-mono text-[10.5px] text-ink">
      {formatted}
    </span>
  );
}
