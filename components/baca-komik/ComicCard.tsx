"use client";

import Link from "next/link";
import type { ComicItem } from "../../lib/komik/api";

export default function ComicCard({ item }: { item: ComicItem }) {
  const type = item.typeLabel || "KOMIK";
  const badge =
    type === "MANHWA"
      ? "bg-sky-600"
      : type === "MANGA"
        ? "bg-emerald-600"
        : type === "MANHUA"
          ? "bg-fuchsia-600"
          : "bg-zinc-600";

  return (
    <Link
      href={"/tools/baca-komik/" + encodeURIComponent(item.id)}
      className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-lg transition hover:-translate-y-0.5 hover:border-violet-500/50"
    >
      <div className="relative aspect-[3/4] bg-zinc-800">
        {item.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.cover}
            alt={item.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl">📖</div>
        )}
        <span
          className={
            "absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase text-white " +
            badge
          }
        >
          {type}
        </span>
        {item.statusLabel && (
          <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] text-zinc-200">
            {item.statusLabel}
          </span>
        )}
      </div>
      <div className="space-y-1 p-2.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-100">
          {item.title}
        </h3>
        <p className="text-[11px] text-zinc-500">
          {item.colorLabel || item.source || "Komik"}
        </p>
      </div>
    </Link>
  );
}
