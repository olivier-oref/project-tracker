"use client";

export function ExportButton({ projectId }: { projectId: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        window.location.href = `/api/projects/${projectId}/export`;
      }}
      className="inline-flex items-center gap-1.5 rounded-[2px] border border-line px-2.5 py-1.5 font-mono text-xs text-muted hover:bg-paper-2"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Export HTML
    </button>
  );
}
