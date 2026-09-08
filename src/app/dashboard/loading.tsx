export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-[5px] bg-navy" />

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5">
        <div className="h-7 w-48 animate-pulse rounded bg-paper-3" />
        <div className="h-4 w-24 animate-pulse rounded bg-paper-3" />
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="flex flex-col gap-10">
          <div className="h-11 w-64 animate-pulse rounded border border-line-2 bg-paper-3" />

          <div className="flex flex-col gap-4">
            <div className="h-6 w-40 animate-pulse rounded bg-paper-3" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="h-40 animate-pulse rounded border border-line-2 bg-paper-3" />
              <div className="h-40 animate-pulse rounded border border-line-2 bg-paper-3" />
              <div className="h-40 animate-pulse rounded border border-line-2 bg-paper-3" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
