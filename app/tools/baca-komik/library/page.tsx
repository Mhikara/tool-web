"use client";

import Link from "next/link";
import { useComicStorage } from "@/lib/useComicStorage";

export default function LibraryPage() {
  const { bookmarks, readingHistory, clearHistory, removeBookmark } =
    useComicStorage();

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0c]/90 px-4 py-3 backdrop-blur">
        <Link href="/tools/baca-komik" className="text-xs text-zinc-500">
          ← Katalog
        </Link>
        <h1 className="mt-1 text-lg font-bold">Rak Buku</h1>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-5">
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Favorit ({bookmarks.length})
          </h2>
          {bookmarks.length === 0 ? (
            <p className="text-sm text-zinc-600">Belum ada bookmark</p>
          ) : (
            <ul className="space-y-2">
              {bookmarks.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center gap-3 rounded-xl bg-zinc-900/50 p-2 ring-1 ring-white/5"
                >
                  <Link
                    href={"/tools/baca-komik/" + encodeURIComponent(b.id)}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <div className="h-14 w-10 overflow-hidden rounded-md bg-zinc-800">
                      {b.cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.cover} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{b.title}</p>
                      <p className="text-[11px] text-zinc-500">{b.source}</p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeBookmark(b.id)}
                    className="text-[11px] text-zinc-500"
                  >
                    Hapus
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Riwayat ({readingHistory.length})
            </h2>
            {readingHistory.length > 0 && (
              <button
                type="button"
                onClick={() => clearHistory()}
                className="text-[11px] text-zinc-500"
              >
                Hapus semua
              </button>
            )}
          </div>
          {readingHistory.length === 0 ? (
            <p className="text-sm text-zinc-600">Belum ada riwayat baca</p>
          ) : (
            <ul className="space-y-2">
              {readingHistory.slice(0, 50).map((h) => (
                <li key={h.comicId + h.chapterId + h.at}>
                  <Link
                    href={
                      "/tools/baca-komik/read/" +
                      encodeURIComponent(h.comicId) +
                      "/" +
                      encodeURIComponent(h.chapterId)
                    }
                    className="block rounded-xl bg-zinc-900/40 px-3 py-2 ring-1 ring-white/5"
                  >
                    <p className="truncate text-sm font-medium">{h.title}</p>
                    <p className="text-[11px] text-zinc-500">
                      {h.chapterTitle || h.chapterId}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
