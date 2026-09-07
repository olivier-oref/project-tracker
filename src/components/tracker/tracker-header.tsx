export function TrackerHeader({
  subtitle,
  title,
  date,
}: {
  subtitle: string | null;
  title: string;
  date: string;
}) {
  return (
    <header className="border-b border-line" style={{ padding: "30px 0 20px" }}>
      {subtitle ? (
        <div
          className="font-mono uppercase text-gold"
          style={{ fontSize: "10.5px", letterSpacing: "0.18em", marginBottom: "9px" }}
        >
          {subtitle}
        </div>
      ) : null}
      <h1
        className="font-serif font-semibold text-navy"
        style={{ fontSize: "36px", lineHeight: 1.08, margin: "0 0 8px", letterSpacing: "-0.015em" }}
      >
        {title}
      </h1>
      <p className="font-mono text-[11px] text-muted" style={{ margin: 0 }}>
        Status as at {date}
      </p>
    </header>
  );
}
