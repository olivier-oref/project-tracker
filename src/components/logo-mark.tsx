// The Project Tracker mark (option G, "Phase timeline"): two completed phases and a checked milestone.
export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className={className}>
      <path d="M8 32 H56" fill="none" stroke="#16233F" strokeOpacity={0.3} strokeWidth={4} />
      <circle cx={11} cy={32} r={6} fill="#16233F" />
      <circle cx={29} cy={32} r={6} fill="#16233F" />
      <circle cx={50} cy={32} r={10} fill="#4A6B45" />
      <path d="M45 32.5 L48.5 36 L55 29" fill="none" stroke="#FAF6EC" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
