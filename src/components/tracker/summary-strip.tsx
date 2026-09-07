export type SummaryMetrics = {
  total: number;
  done: number;
  inProgress: number;
  blocked: number;
  noDueDate: number;
  completePercent: number;
};

export function SummaryStrip({ metrics }: { metrics: SummaryMetrics }) {
  const items: { label: string; value: string | number }[] = [
    { label: "Tasks", value: metrics.total },
    { label: "Done", value: metrics.done },
    { label: "In progress", value: metrics.inProgress },
    { label: "Blocked", value: metrics.blocked },
    { label: "No due date", value: metrics.noDueDate },
    { label: "Complete", value: `${metrics.completePercent}%` },
  ];

  return (
    <div className="flex flex-wrap border-t border-line py-6">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={`min-w-[120px] flex-1 px-4 py-2 ${
            index > 0 ? "border-l border-line" : ""
          }`}
        >
          <p className="font-serif text-[25px] text-navy">{item.value}</p>
          <p className="font-mono text-[9.5px] uppercase tracking-wide text-muted">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
