"use client";

import Link from "next/link";

type Item = {
  id: string;
  title: string;
  cover?: string | null;
  latestChapter?: string | null;
  statusLabel?: string | null;
  rating?: number | string | null;
  updatedAt?: string | null;
};

function coverSrc(c?: string | null) {
  if (!c) return null;
  if (c.startsWith("/api/")) return c;
  if (c.startsWith("http"))
    return "/api/komik/image?url=" + encodeURIComponent(c);
  return c;
}

function timeAgo(iso?: string | null) {
  if (!iso) return "baru saja";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "baru saja";
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return m + " menit";
  const h = Math.floor(m / 60);
  if (h < 24) return h + " jam";
  return Math.floor(h / 24) + " hari";
}

export default function UpdateList({
  title,
  items,
}: {
  title: string;
  items: Item[];
}) {
  return (
    <section className="px-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold text-white">
          <span className="rounded-lg bg-violet-600/30 px-2 py-0.5 text-violet-300">
            ▣
          </span>
          {title}
        </h2>
        <Link
          href="/tools/baca-komik/katalog"
          className="rounded-full bg-sky-600/90 px-3 py-1 text-[11px] font-semibold text-white"
        >
          Lihat semua ›
        </Link>
      </div>
      <div className="space-y-3">
        {items.slice(0, 8).map((it) => {
          const c = coverSrc(it.cover);
          return (
            <Link
              key={it.id}
              href={"/tools/baca-komik/" + encodeURIComponent(it.id)}
              className="flex gap-3 rounded-2xl bg-zinc-900/80 p-2.5 ring-1 ring-white/5"
            >
              <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                {c ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-lg opacity-40">
                    📖
                  </div>
                )}
                {it.rating != null && (
                  <span className="absolute left-1 top-1 rounded bg-black/70 px-1 text-[9px] font-bold text-amber-300">
                    {it.rating}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold text-zinc-100">
                  {it.title}
                </p>
                <div className="mt-1.5 space-y-1">
                  {[it.latestChapter, it.statusLabel]
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((ch, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg bg-zinc-800/80 px-2 py-1"
                      >
                        <span className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          {ch}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {timeAgo(it.updatedAt)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
