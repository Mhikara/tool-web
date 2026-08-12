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
    if (list.length >= 10) break;
  }
  if (!list.length) return null;

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-zinc-400">
        <History className="h-3.5 w-3.5" /> Lanjutkan baca
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {list.map((h) => (
          <Link
            key={h.comicId + h.chapterId}
            href={
              "/tools/baca-komik/read/" +
              encodeURIComponent(h.comicId) +
              "/" +
              encodeURIComponent(h.chapterId)
            }
            className="flex max-w-[180px] shrink-0 items-center gap-2 rounded-full bg-zinc-900 py-1.5 pl-1.5 pr-3 text-xs ring-1 ring-white/5"
          >
            {h.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={h.cover} alt="" className="h-7 w-7 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800">📖</span>
            )}
            <span className="truncate text-zinc-300">{h.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
