export default function AdminLoading() {
  return (
    <div className="min-h-screen flex animate-pulse">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-sidebar p-4 gap-2">
        <div className="mb-6 h-6 w-28 rounded bg-muted" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 rounded bg-muted" />
        ))}
      </aside>
      <main className="flex-1 p-6 space-y-6">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-muted" />
          ))}
        </div>
        <div className="h-64 rounded-lg bg-muted" />
      </main>
    </div>
  );
}
