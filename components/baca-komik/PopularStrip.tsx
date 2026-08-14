"use client";

import Link from "next/link";

type Item = {
  id: string;
  title: string;
  cover?: string | null;
  latestChapter?: string | null;
  rating?: number | string | null;
};

function coverSrc(c?: string | null) {
  if (!c) return null;
  if (c.startsWith("/api/")) return c;
  if (c.startsWith("http"))
    return "/api/komik/image?url=" + encodeURIComponent(c);
  return c;
}

export default function PopularStrip({
  items,
  period,
  onPeriod,
}: {
  items: Item[];
  period: string;
  onPeriod: (p: string) => void;
}) {
  const tabs = [
    ["all", "Sepanjang masa"],
    ["day", "Harian"],
    ["week", "Mingguan"],
    ["month", "Bulanan"],
  ];

  return (
    <section className="px-3">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 text-white">
          🔥
        </span>
        <h2 className="text-base font-bold text-white">Populer</h2>
      </div>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onPeriod(id)}
            className={
              "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold " +
              (period === id
                ? "bg-red-600 text-white"
                : "bg-zinc-900 text-zinc-400 ring-1 ring-white/10")
            }
          >
            {label}
          </button>
        ))}
        <Link
          href="/tools/baca-komik/katalog?sort=followed"
          className="shrink-0 rounded-full bg-red-600/20 px-3 py-1.5 text-[11px] font-semibold text-red-400"
        >
          Lihat semua ›
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.slice(0, 12).map((it) => {
          const c = coverSrc(it.cover);
          return (
            <Link
              key={it.id}
              href={"/tools/baca-komik/" + encodeURIComponent(it.id)}
              className="w-[140px] shrink-0"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-zinc-800 ring-1 ring-white/10">
                {c ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c}
                    alt={it.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center opacity-40">
                    📖
                  </div>
                )}
                {it.rating != null && (
                  <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 text-[10px] font-bold text-amber-300">
                    ★ {it.rating}
                  </span>
                )}
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs font-semibold text-zinc-200">
                {it.title}
              </p>
              <p className="truncate text-[10px] text-zinc-500">
                {it.latestChapter || "—"}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
