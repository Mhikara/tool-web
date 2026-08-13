"use client";

import Link from "next/link";
import { History } from "lucide-react";
import type { HistoryItem } from "@/lib/useComicStorage";

export default function ContinueStrip({ items }: { items: HistoryItem[] }) {
  const seen = new Set<string>();
  const list: HistoryItem[] = [];
  for (const h of items) {
    if (seen.has(h.comicId)) continue;
    seen.add(h.comicId);
    list.push(h);
    if (list.length >= 12) break;
  }
  if (!list.length) return null;

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-zinc-400">
        <History className="h-3.5 w-3.5" /> Lanjutkan baca
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {list.map((h) => {
          const cover =
            h.cover && h.cover.startsWith("http")
              ? "/api/komik/image?url=" + encodeURIComponent(h.cover)
              : h.cover;
          return (
            <Link
              key={h.comicId + ":" + h.chapterId}
              href={
                "/tools/baca-komik/read/" +
                encodeURIComponent(h.comicId) +
                "/" +
                encodeURIComponent(h.chapterId)
              }
              className="flex w-[72px] shrink-0 flex-col gap-1"
            >
              <div className="aspect-[3/4] overflow-hidden rounded-xl bg-zinc-800 ring-1 ring-white/10">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover}
                    alt={h.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-lg opacity-40">
                    📖
                  </div>
                )}
              </div>
              <p className="line-clamp-2 text-[10px] leading-tight text-zinc-300">
                {h.title}
              </p>
              <p className="truncate text-[9px] text-zinc-600">
                {h.chapterTitle || "Lanjut"}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
