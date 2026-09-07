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
    <header className="flex flex-col gap-2 py-8">
      {subtitle ? (
        <p className="font-mono text-xs uppercase tracking-wide text-gold">
          {subtitle}
        </p>
      ) : null}
      <h1 className="font-serif text-[36px] leading-tight text-navy">
        {title}
      </h1>
      <p className="font-mono text-xs text-muted">Status as at {date}</p>
    </header>
  );
}
