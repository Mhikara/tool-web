"use client";

import Link from "next/link";

export type CatalogItem = {
  id: string;
  title: string;
  cover?: string | null;
  typeLabel?: string;
  rating?: number | string | null;
  latestChapter?: string | null;
  statusLabel?: string | null;
};

function typeBadge(type?: string) {
  const t = (type || "").toUpperCase();
  if (t.includes("MANHWA")) return "bg-sky-500";
  if (t.includes("MANHUA")) return "bg-rose-500";
  if (t.includes("MANGA")) return "bg-amber-500";
  return "bg-zinc-600";
}

export default function CatalogCard({ item }: { item: CatalogItem }) {
  const cover =
    item.cover && item.cover.startsWith("http")
      ? "/api/komik/image?url=" + encodeURIComponent(item.cover)
      : item.cover;

  return (
    <Link
      href={"/tools/baca-komik/" + encodeURIComponent(item.id)}
      className="group overflow-hidden rounded-2xl bg-zinc-900/50 ring-1 ring-white/5 transition hover:ring-violet-500/40"
    >
      <div className="relative aspect-[3/4] bg-zinc-800">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={item.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl opacity-40">
            {"📖"}
          </div>
        )}
        <span
          className={
            "absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white " +
            typeBadge(item.typeLabel)
          }
        >
          {(item.typeLabel || "KOMIK").toUpperCase()}
        </span>
        {item.rating != null && item.rating !== "" && (
          <span className="absolute right-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
            ★ {item.rating}
          </span>
        )}
      </div>
      <div className="space-y-0.5 p-2.5">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-zinc-100">
          {item.title}
        </h3>
        <p className="truncate text-[11px] text-zinc-500">
          {item.latestChapter || item.statusLabel || "—"}
        </p>
      </div>
    </Link>
  );
}
