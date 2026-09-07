export function PhaseBadge({ phase }: { phase: string | null }) {
  if (!phase) return null;

  return (
    <span className="inline-block rounded-[2px] border border-line bg-paper-2 px-2 py-1 font-mono text-[10.5px] text-navy">
      {phase}
    </span>
  );
}
