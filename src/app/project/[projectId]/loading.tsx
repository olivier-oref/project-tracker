export default function ProjectLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-[5px] bg-navy" />

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5">
        <div className="h-7 w-80 animate-pulse rounded bg-paper-3" />
        <div className="h-4 w-24 animate-pulse rounded bg-paper-3" />
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="flex flex-col gap-6">
          <div className="h-10 w-56 animate-pulse rounded bg-paper-3" />

          <div className="flex flex-col gap-3">
            <div className="h-14 animate-pulse rounded border border-line-2 bg-paper-3" />
            <div className="h-14 animate-pulse rounded border border-line-2 bg-paper-3" />
            <div className="h-14 animate-pulse rounded border border-line-2 bg-paper-3" />
          </div>
        </div>
      </main>
    </div>
  );
}
