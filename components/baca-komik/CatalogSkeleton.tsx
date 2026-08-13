export default function CatalogSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl bg-zinc-900/40 ring-1 ring-white/5"
        >
          <div className="aspect-[3/4] animate-pulse bg-zinc-800" />
          <div className="space-y-2 p-2.5">
            <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-800" />
            <div className="h-2 w-1/2 animate-pulse rounded bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
