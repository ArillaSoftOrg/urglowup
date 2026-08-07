export default function StylesLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8 animate-pulse">
      <div className="h-3 w-48 rounded bg-muted" />
      <div className="space-y-2">
        <div className="h-7 w-40 rounded bg-muted" />
        <div className="h-4 w-64 rounded bg-muted" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-5 w-24 rounded bg-muted" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((j) => (
              <div key={j} className="h-12 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
