export default function StyleGuideLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-10 animate-pulse">
      <div className="h-3 w-64 rounded bg-muted" />
      <div className="space-y-3">
        <div className="h-8 w-40 rounded bg-muted" />
        <div className="h-4 w-56 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-5 w-48 rounded bg-muted" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-xl bg-muted" />)}
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="aspect-square rounded-xl bg-muted" />)}
        </div>
      </div>
    </div>
  );
}
