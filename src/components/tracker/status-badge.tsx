const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  not_started: {
    label: "NOT STARTED",
    className: "bg-paper-3 text-muted border-line-2",
  },
  in_progress: {
    label: "IN PROGRESS",
    className: "bg-gold text-white border-gold",
  },
  blocked: {
    label: "BLOCKED",
    className: "bg-rust text-[#FDEFEA] border-rust",
  },
  done: {
    label: "DONE",
    className: "bg-green text-[#F1F6EF] border-green",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_started;

  return (
    <span
      className={`inline-block rounded-[2px] border px-2 py-1 font-mono text-[9.5px] uppercase tracking-wide ${config.className}`}
    >
      {config.label}
    </span>
  );
}
