"use client";

import Link from "next/link";
import { History, Shuffle } from "lucide-react";
import type { HistoryItem } from "../../lib/useComicStorage";

type Props = {
  history: HistoryItem[];
  onRandom?: () => void;
};

export default function ContinueStrip({ history, onRandom }: Props) {
  const list = history.slice(0, 10);
  if (!list.length && !onRandom) return null;

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-zinc-200">
          <History className="h-4 w-4 text-violet-400" />
          Lanjutkan membaca
        </div>
        {onRandom && (
          <button
            type="button"
            onClick={onRandom}
            className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
          >
            <Shuffle className="h-3.5 w-3.5" /> Acak
          </button>
        )}
      </div>
      {list.length > 0 ? (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {list.map((h) => (
            <Link
              key={h.chapterId + String(h.at)}
              href={
                "/tools/baca-komik/read/" +
                encodeURIComponent(h.comicId) +
                "/" +
                encodeURIComponent(h.chapterId)
              }
              className="w-[7.25rem] shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
            >
              {h.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={h.cover}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="aspect-[3/4] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[3/4] items-center justify-center bg-zinc-800 text-xl">
                  📖
                </div>
              )}
              <div className="p-1.5">
                <p className="line-clamp-2 text-[11px] font-semibold leading-snug">
                  {h.title}
                </p>
                <p className="truncate text-[10px] text-violet-300/90">
                  {h.chapterTitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-500">
          Belum ada riwayat. Baca satu chapter untuk muncul di sini.
        </p>
      )}
    </section>
  );
}
