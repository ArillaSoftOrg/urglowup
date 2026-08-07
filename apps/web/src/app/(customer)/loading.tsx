export default function CustomerLoading() {
  return (
    <div className="container mx-auto flex-1 px-4 py-8 animate-pulse">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-56 shrink-0 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 rounded bg-muted" />
          ))}
        </aside>
        <main className="flex-1 min-w-0 space-y-4">
          <div className="h-8 w-40 rounded bg-muted" />
          <div className="h-32 rounded-lg bg-muted" />
          <div className="h-32 rounded-lg bg-muted" />
          <div className="h-32 rounded-lg bg-muted" />
        </main>
      </div>
    </div>
  );
}
