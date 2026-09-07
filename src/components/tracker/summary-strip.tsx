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
    <div className="flex flex-wrap border-t border-line" style={{ margin: "22px 0 10px" }}>
      {items.map((item, index) => (
        <div
          key={item.label}
          className="flex-1 basis-[120px]"
          style={{
            padding: "12px 14px 12px 0",
            borderRight: index < items.length - 1 ? "1px solid var(--color-line)" : "none",
          }}
        >
          <div className="font-serif text-[25px] font-semibold leading-none text-navy">
            {item.value}
          </div>
          <div
            className="font-mono uppercase text-muted"
            style={{ fontSize: "9.5px", letterSpacing: "0.12em", marginTop: "6px" }}
          >
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
