"use client";

import Link from "next/link";
import type { ComicItem } from "../../lib/komik/api";

export default function ComicCard({ item }: { item: ComicItem }) {
  const type = (item.typeLabel || "KOMIK").toUpperCase();
  const badge =
    type.includes("MANHWA")
      ? "bg-sky-500/90"
      : type.includes("MANGA")
        ? "bg-emerald-500/90"
        : type.includes("MANHUA")
          ? "bg-fuchsia-500/90"
          : "bg-zinc-600/90";

  const cover =
    item.cover && item.cover.startsWith("http")
      ? "/api/komik/image?url=" + encodeURIComponent(item.cover)
      : item.cover;

  return (
    <Link
      href={"/tools/baca-komik/" + encodeURIComponent(item.id)}
      className="group block overflow-hidden rounded-2xl bg-zinc-900/40 ring-1 ring-white/5 transition hover:ring-violet-500/40"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-800/80">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={item.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl opacity-40">
            📖
          </div>
        )}
        <span
          className={
            "absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white " +
            badge
          }
        >
          {type}
        </span>
      </div>
      <div className="space-y-0.5 p-2.5">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-zinc-100">
          {item.title}
        </h3>
        <p className="truncate text-[11px] text-zinc-500">
          {item.statusLabel || item.source || "Komik"}
        </p>
      </div>
    </Link>
  );
}
