"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Heart, History, Search, X } from "lucide-react";
import ComicCard from "../../../components/baca-komik/ComicCard";
import { useComicStorage } from "../../../lib/useComicStorage";
import {
  fetchHome,
  normalizeList,
  searchComics,
  type ComicItem,
} from "../../../lib/komik/api";

export default function BacaKomikCatalogPage() {
  const { readingHistory, bookmarks } = useComicStorage();
  const [source, setSource] = useState("all");
  const [sort, setSort] = useState<"latest" | "popular" | "rating">("latest");
  const [statusFilter, setStatusFilter] = useState<"all" | "ongoing" | "completed">(
    "all"
  );
  const [q, setQ] = useState("");
  const [genreId, setGenreId] = useState("");
  const [genres, setGenres] = useState<{ id: string; name: string }[]>([]);
  const [typeFilter, setTypeFilter] = useState<"all" | "manga" | "manhwa" | "manhua">("all");

  const [suggest, setSuggest] = useState<ComicItem[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [latest, setLatest] = useState<ComicItem[]>([]);
  const [popular, setPopular] = useState<ComicItem[]>([]);
  const [topRated, setTopRated] = useState<ComicItem[]>([]);
  const [searchList, setSearchList] = useState<ComicItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [view, setView] = useState<"katalog" | "favorit">("katalog");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchHome(source);
      setLatest(normalizeList(data.latest || data.list || []));
      setPopular(normalizeList(data.popular || []));
      setTopRated(normalizeList(data.topRated || []));
    } catch (e: any) {
      setErr(e.message || "Gagal memuat");
    } finally {
      setLoading(false);
    }
  }, [source]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!q.trim()) {
      setSuggest([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const data = await searchComics(q.trim(), source);
        setSuggest(normalizeList(data.list || []).slice(0, 6));
        setShowSuggest(true);
      } catch {
        setSuggest([]);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q, source]);

  const onSearchSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!q.trim()) {
      setSearchList(null);
      return;
    }
    setLoading(true);
    setShowSuggest(false);
    try {
      const data = await searchComics(q.trim(), source);
      setSearchList(normalizeList(data.list || []));
      setView("katalog");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const grid = useMemo(() => {
    if (view === "favorit") {
      return bookmarks.map((b) => ({
        id: b.id,
        title: b.title,
        url: b.id,
        cover: b.cover || null,
        source: b.source,
        statusLabel: b.statusLabel,
        typeLabel:
          b.source === "omega" || b.source === "fullmanhwa"
            ? "MANHWA"
            : b.source === "mangadex"
              ? "MANGA"
              : "KOMIK",
      })) as ComicItem[];
    }
    let list = searchList
      ? searchList
      : sort === "popular"
        ? popular.length
          ? popular
          : latest
        : sort === "rating"
          ? topRated.length
            ? topRated
            : latest
          : latest;

    if (statusFilter === "ongoing") {
      list = list.filter((x) =>
        (x.statusLabel || "").toLowerCase().includes("ongoing")
      );
    }
    if (statusFilter === "completed") {
      list = list.filter((x) => {
        const s = (x.statusLabel || "").toLowerCase();
        return s.includes("tamat") || s.includes("completed");
      });
    }
    return list;
  }, [
    view,
    bookmarks,
    searchList,
    sort,
    popular,
    topRated,
    latest,
    statusFilter,
  ]);

  const continueList = readingHistory.slice(0, 8);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2.5 sm:px-4">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">
            ← Home
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-xs font-black">
              BK
            </span>
            <span className="font-bold tracking-tight">Baca Komik</span>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-3 pb-3 sm:px-4">
          <form onSubmit={onSearchSubmit} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => suggest.length && setShowSuggest(true)}
              placeholder="Cari manga, manhwa, manhua..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-9 pr-10 text-sm outline-none focus:border-violet-500"
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setSearchList(null);
                  setSuggest([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {showSuggest && suggest.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
                {suggest.map((s) => (
                  <Link
                    key={s.id}
                    href={"/tools/baca-komik/" + encodeURIComponent(s.id)}
                    onClick={() => setShowSuggest(false)}
                    className="flex items-center gap-3 border-b border-zinc-800/80 px-3 py-2 hover:bg-zinc-800/80"
                  >
                    {s.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.cover}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-12 w-9 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-9 rounded bg-zinc-800" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{s.title}</p>
                      <p className="text-[11px] text-zinc-500">
                        {s.statusLabel || s.source || "Komik"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4">
        {/* FullManhwa Clean Mode Banner */}
        <div className="mb-4 rounded-xl border border-violet-800/40 bg-gradient-to-r from-violet-900/30 to-zinc-900 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-white">FullManhwa — Mode Bersih</h3>
              <p className="text-xs text-zinc-400">Baca tanpa iklan & tanpa gambar (hemat data). Toggle ON jika ingin lihat gambar chapter.</p>
            </div>
            <Link href="/tools/baca-komik/fullmanhwa" className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-center text-xs font-bold text-white hover:bg-violet-500">
              Buka Mode Bersih
            </Link>
          </div>
        </div>
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setView("katalog")}
            className={
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold " +
              (view === "katalog"
                ? "bg-violet-600 text-white"
                : "bg-zinc-900 text-zinc-400")
            }
          >
            <BookOpen className="h-4 w-4" /> Katalog
          </button>
          <button
            type="button"
            onClick={() => setView("favorit")}
            className={
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold " +
              (view === "favorit"
                ? "bg-violet-600 text-white"
                : "bg-zinc-900 text-zinc-400")
            }
          >
            <Heart className="h-4 w-4" /> Favorit ({bookmarks.length})
          </button>
        </div>

        {view === "katalog" && continueList.length > 0 && (
          <section className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <History className="h-4 w-4 text-violet-400" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-300">
                Lanjutkan membaca
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {continueList.map((h) => (
                <Link
                  key={h.chapterId + h.at}
                  href={
                    "/tools/baca-komik/read/" +
                    encodeURIComponent(h.comicId) +
                    "/" +
                    encodeURIComponent(h.chapterId)
                  }
                  className="w-28 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
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
                    <div className="aspect-[3/4] bg-zinc-800" />
                  )}
                  <div className="p-1.5">
                    <p className="line-clamp-2 text-[11px] font-semibold">
                      {h.title}
                    </p>
                    <p className="truncate text-[10px] text-zinc-500">
                      {h.chapterTitle}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {view === "katalog" && (
          <div className="mb-4 space-y-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                ["all", "Semua sumber"],
                ["omega", "Manhwa 18+"],
                ["fullmanhwa", "FullManhwa"],
                ["mangadex", "MangaDex"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSource(id)}
                  className={
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold " +
                    (source === id
                      ? "bg-violet-600 text-white"
                      : "bg-zinc-900 text-zinc-400")
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(
                [
                  ["latest", "Terbaru"],
                  ["popular", "Terpopuler"],
                  ["rating", "Rating"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSort(id);
                    setSearchList(null);
                  }}
                  className={
                    "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold " +
                    (sort === id && !searchList
                      ? "bg-zinc-100 text-zinc-900"
                      : "bg-zinc-900 text-zinc-400")
                  }
                >
                  {label}
                </button>
              ))}
              {(
                [
                  ["all", "Semua status"],
                  ["ongoing", "Ongoing"],
                  ["completed", "Tamat"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setStatusFilter(id)}
                  className={
                    "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold " +
                    (statusFilter === id
                      ? "bg-violet-500/20 text-violet-300"
                      : "bg-zinc-900 text-zinc-500")
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {view === "favorit"
              ? "Favorit"
              : searchList
                ? "Hasil pencarian"
                : "Katalog"}
          </h2>
          <span className="text-xs text-zinc-500">{grid.length} judul</span>
        </div>

        {loading && <p className="text-sm text-zinc-500">Memuat...</p>}
        {err && !loading && (
          <p className="mb-3 text-sm text-amber-400">{err}</p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {grid.map((item) => (
            <ComicCard key={item.id} item={item} />
          ))}
        </div>
        {!loading && grid.length === 0 && (
          <p className="mt-6 text-center text-sm text-zinc-500">
            Tidak ada data.
          </p>
        )}
      </main>
    
      <footer className="mt-10 border-t border-zinc-800 py-6 text-center text-xs text-zinc-500">
        Baca Komik · Developer by <span className="font-semibold text-violet-400">Meydi</span>
      </footer>
</div>
  );
}
