"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Heart, History, Search, X } from "lucide-react";
import ComicCard from "../../../components/baca-komik/ComicCard";
import { useComicStorage } from "../../../lib/useComicStorage";
import {
  fetchHome,
  normalizeList,
  searchComics,
  type ComicItem,
} from "../../../lib/komik/api";

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition " +
        (active
          ? "bg-white text-zinc-900"
          : "bg-zinc-900/80 text-zinc-400 ring-1 ring-white/5 hover:text-zinc-200")
      }
    >
      {children}
    </button>
  );
}

export default function BacaKomikCatalogPage() {
  const { readingHistory, bookmarks } = useComicStorage();
  const [source, setSource] = useState("all");
  const [sort, setSort] = useState<"latest" | "popular" | "rating">("latest");
  const [statusFilter, setStatusFilter] = useState<"all" | "ongoing" | "completed">("all");
  const [q, setQ] = useState("");
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

    if (typeFilter !== "all") {
      const t = typeFilter.toUpperCase();
      list = list.filter(
        (x) =>
          (x.typeLabel || "").toUpperCase().includes(t) ||
          (x.source || "").toLowerCase().includes(typeFilter)
      );
    }
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
    typeFilter,
  ]);

  const continueList = readingHistory.slice(0, 8);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">
            ←
          </Link>
          <div className="flex flex-1 items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-[11px] font-black shadow-lg shadow-violet-500/20">
              BK
            </span>
            <div>
              <p className="text-sm font-bold leading-none tracking-tight">Baca Komik</p>
              <p className="text-[10px] text-zinc-500">Manga · Manhwa · Manhua</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setView(view === "favorit" ? "katalog" : "favorit")}
            className={
              "rounded-full p-2 " +
              (view === "favorit" ? "text-rose-400" : "text-zinc-500 hover:text-zinc-300")
            }
            aria-label="Favorit"
          >
            <Heart className={"h-4 w-4 " + (view === "favorit" ? "fill-current" : "")} />
          </button>
        </div>

        {/* Search */}
        <div className="mx-auto max-w-5xl px-4 pb-3">
          <form onSubmit={onSearchSubmit} className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => suggest.length && setShowSuggest(true)}
              placeholder="Cari judul..."
              className="w-full rounded-2xl border-0 bg-zinc-900/90 py-3 pl-10 pr-10 text-sm text-zinc-100 outline-none ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-violet-500/50"
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
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl ring-1 ring-white/10">
                {suggest.map((s) => (
                  <Link
                    key={s.id}
                    href={"/tools/baca-komik/" + encodeURIComponent(s.id)}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5"
                    onClick={() => setShowSuggest(false)}
                  >
                    <div className="h-10 w-8 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                      {s.cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            s.cover.startsWith("http")
                              ? "/api/komik/image?url=" + encodeURIComponent(s.cover)
                              : s.cover
                          }
                          alt=""
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <span className="line-clamp-1 text-sm">{s.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-5">
        {/* Lanjutkan */}
        {continueList.length > 0 && view === "katalog" && !searchList && (
          <section>
            <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-zinc-400">
              <History className="h-3.5 w-3.5" /> Lanjutkan baca
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {continueList.map((h) => (
                <Link
                  key={h.comicId + ":" + h.chapterId}
                  href={
                    "/tools/baca-komik/read/" +
                    encodeURIComponent(h.comicId) +
                    "/" +
                    encodeURIComponent(h.chapterId)
                  }
                  className="flex max-w-[200px] shrink-0 items-center gap-2 rounded-full bg-zinc-900 py-1.5 pl-1.5 pr-3 text-xs text-zinc-300 ring-1 ring-white/5"
                >
                  {h.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={h.cover}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[10px]">
                      📖
                    </span>
                  )}
                  <span className="truncate">{h.title}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Filters — satu baris, tidak padat */}
        <section className="space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {[
              ["all", "Semua"],
              ["mangadex", "MangaDex"],
              ["fullmanhwa", "FullManhwa"],
              ["komiku", "Komiku"],
            ].map(([id, label]) => (
              <Pill key={id} active={source === id} onClick={() => setSource(id)}>
                {label}
              </Pill>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {(
              [
                ["all", "Tipe"],
                ["manga", "Manga"],
                ["manhwa", "Manhwa"],
                ["manhua", "Manhua"],
              ] as const
            ).map(([id, label]) => (
              <Pill
                key={id}
                active={typeFilter === id}
                onClick={() => setTypeFilter(id)}
              >
                {label}
              </Pill>
            ))}
            <span className="mx-1 w-px shrink-0 bg-white/10" />
            {(
              [
                ["latest", "Terbaru"],
                ["popular", "Populer"],
                ["rating", "Top"],
              ] as const
            ).map(([id, label]) => (
              <Pill key={id} active={sort === id} onClick={() => setSort(id)}>
                {label}
              </Pill>
            ))}
            <span className="mx-1 w-px shrink-0 bg-white/10" />
            {(
              [
                ["all", "Status"],
                ["ongoing", "Ongoing"],
                ["completed", "Tamat"],
              ] as const
            ).map(([id, label]) => (
              <Pill
                key={id}
                active={statusFilter === id}
                onClick={() => setStatusFilter(id)}
              >
                {label}
              </Pill>
            ))}
          </div>
        </section>

        {/* Status */}
        {err && (
          <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-300">
            {err}
          </p>
        )}
        {loading && (
          <p className="py-12 text-center text-sm text-zinc-500">Memuat…</p>
        )}

        {/* Grid */}
        {!loading && (
          <section>
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-sm font-semibold text-zinc-300">
                {view === "favorit"
                  ? "Favorit"
                  : searchList
                    ? "Hasil pencarian"
                    : "Katalog"}
              </h2>
              <span className="text-[11px] text-zinc-600">{grid.length} judul</span>
            </div>
            {grid.length === 0 ? (
              <p className="py-16 text-center text-sm text-zinc-600">
                Tidak ada judul di filter ini
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
                {grid.map((item) => (
                  <ComicCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>
        )}

        <footer className="border-t border-white/5 py-8 text-center text-[11px] text-zinc-600">
          Baca Komik · Developer by{" "}
          <span className="font-semibold text-violet-400/90">Meydi</span>
        </footer>
      </main>
    </div>
  );
}
