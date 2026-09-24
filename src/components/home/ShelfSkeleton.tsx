/** Placeholder shown while a shelf of covers streams in. */
export function ShelfSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="shelf-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-2"
      aria-busy="true"
      aria-label="Carregando"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="pb-3">
          <div className="aspect-[2/3] rounded bg-card-border/50 animate-pulse" />
          <div className="mt-2 h-4 w-3/4 rounded bg-card-border/50 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
