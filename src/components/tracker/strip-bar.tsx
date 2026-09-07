export type StripMetrics = {
  total: number;
  done: number;
  inProgress: number;
  blocked: number;
  noDueDate: number;
};

export function StripBar({ metrics }: { metrics: StripMetrics }) {
  const completePercent = metrics.total ? Math.round((metrics.done / metrics.total) * 100) : 0;

  const cells: [number | string, string][] = [
    [metrics.total, "Tasks on the board"],
    [metrics.done, "Done"],
    [metrics.inProgress, "In progress"],
    [metrics.blocked, "Blocked"],
    [metrics.noDueDate, "No due date"],
    [`${completePercent}%`, "Complete"],
  ];

  return (
    <div className="strip">
      {cells.map(([num, label]) => (
        <div className="strip-cell" key={label}>
          <div className="strip-num">{num}</div>
          <div className="strip-lab">{label}</div>
        </div>
      ))}
    </div>
  );
}
