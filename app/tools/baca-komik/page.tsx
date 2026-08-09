"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import KomikNavbar from "@/components/komik/Navbar";
import ComicCard from "@/components/komik/ComicCard";
import HeroCarousel from "@/components/komik/HeroCarousel";
import FilterBar from "@/components/komik/FilterBar";
import { fetchHome, normalizeList, searchComics } from "@/lib/komik/api";
import { getBookmarks, getHistory } from "@/lib/komik/storage";
import type { ComicItem } from "@/lib/komik/types";

export default function BacaKomikCatalogPage() {
  const sp = useSearchParams();
  const tab = sp.get("tab") || "home";
  const qParam = sp.get("q") || "";

  const [source, setSource] = useState("all");
  const [sort, setSort] = useState("latest");
  const [latest, setLatest] = useState<ComicItem[]>([]);
  const [popular, setPopular] = useState<ComicItem[]>([]);
  const [topRated, setTopRated] = useState<ComicItem[]>([]);
  const [searchList, setSearchList] = useState<ComicItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [favs, setFavs] = useState<ComicItem[]>([]);
  const [hist, setHist] = useState<ReturnType<typeof getHistory>>([]);

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
    setFavs(getBookmarks());
    setHist(getHistory());
  }, [tab]);

  useEffect(() => {
    if (!qParam) return;
    (async () => {
      setLoading(true);
      try {
        const data = await searchComics(qParam, source);
        setSearchList(normalizeList(data.list || []));
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [qParam, source]);

  const onSearch = async (q: string) => {
    if (!q.trim()) {
      setSearchList(null);
      return load();
    }
    setLoading(true);
    setErr("");
    try {
      const data = await searchComics(q.trim(), source);
      setSearchList(normalizeList(data.list || []));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const grid = useMemo(() => {
    if (tab === "favorit") return favs;
    if (searchList) return searchList;
    if (sort === "popular") return popular.length ? popular : latest;
    if (sort === "rating") return topRated.length ? topRated : latest;
    return latest;
  }, [tab, favs, searchList, sort, popular, topRated, latest]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <KomikNavbar
        onSearch={onSearch}
        active={
          tab === "favorit"
            ? "favorit"
            : tab === "riwayat"
              ? "riwayat"
              : tab === "katalog"
                ? "katalog"
                : "home"
        }
      />
      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4">
        {tab !== "favorit" && tab !== "riwayat" && (
          <>
            <HeroCarousel items={popular.length ? popular : latest} />
            <FilterBar
              source={source}
              onSource={setSource}
              sort={sort}
              onSort={setSort}
            />
          </>
        )}

        {tab === "riwayat" && (
          <section className="mb-4">
            <h2 className="mb-3 text-lg font-bold">Riwayat baca</h2>
            <div className="space-y-2">
              {hist.length === 0 && (
                <p className="text-sm text-zinc-500">Belum ada riwayat.</p>
              )}
              {hist.map((h) => (
                <a
                  key={h.chapterId + h.at}
                  href={
                    "/tools/baca-komik/read/" +
                    encodeURIComponent(h.chapterId) +
                    "?comic=" +
                    encodeURIComponent(h.comicId) +
                    "&title=" +
                    encodeURIComponent(h.chapterTitle)
                  }
                  className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-2"
                >
                  {h.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={h.cover}
                      alt=""
                      className="h-14 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="h-14 w-10 rounded bg-zinc-800" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{h.title}</p>
                    <p className="text-xs text-zinc-500">{h.chapterTitle}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {tab !== "riwayat" && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {tab === "favorit"
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
          </>
        )}
      </main>
    </div>
  );
}
