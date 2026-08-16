"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useDebounce } from "@/lib/useDebounce";
import {
  parseFilters,
  toQuery,
  type CatalogFilters,
} from "@/lib/komik/catalogParams";
import FilterPanel from "@/components/baca-komik/FilterPanel";
import CatalogCard, {
  type CatalogItem,
} from "@/components/baca-komik/CatalogCard";
import CatalogSkeleton from "@/components/baca-komik/CatalogSkeleton";

const PAGE_SIZE = 24;

export default function KatalogClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const [searchInput, setSearchInput] = useState(filters.q);
  const debouncedQ = useDebounce(searchInput, 400);
  const [drawer, setDrawer] = useState(false);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setSearchInput(filters.q);
  }, [filters.q]);

  useEffect(() => {
    if (debouncedQ === filters.q) return;
    const next = { ...filters, q: debouncedQ, page: 1 };
    router.replace(pathname + toQuery(next), { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const setFilters = useCallback(
    (patch: Partial<CatalogFilters>) => {
      const next = { ...filters, ...patch };
      router.push(pathname + toQuery(next), { scroll: false });
    },
    [filters, pathname, router]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const sp = new URLSearchParams();
      sp.set("action", filters.q.trim() ? "search" : "home");
      if (filters.q.trim()) sp.set("q", filters.q.trim());
      sp.set("source", "mangadex");
      if (filters.type !== "all") sp.set("type", filters.type);
      if (filters.demographic !== "all") {
        sp.set("demographic", filters.demographic);
      }
      // genre difilter di client (bukan tag UUID MangaDex)
      // if (filters.genres[0]) sp.set("genre", filters.genres[0]);

      const res = await fetch("/api/komik?" + sp.toString());
      if (!res.ok) throw new Error("Gagal memuat katalog");
      const data = await res.json();
      let list: CatalogItem[] = (data.list || data.latest || []).map(
        (x: any) => ({
          id: String(x.id),
          title: x.title || "Tanpa judul",
          cover: x.cover,
          typeLabel: x.typeLabel || x.source,
          rating: x.rating,
          latestChapter: x.latestChapter || x.statusLabel,
          statusLabel: x.statusLabel,
        })
      );

      
      // type label longgar
      if (filters.type && filters.type !== "all") {
        const want = filters.type.toLowerCase();
        list = list.filter((x: any) => {
          const tl = String(x.typeLabel || x.source || "").toLowerCase();
          if (want === "manhwa") return tl.includes("manhwa") || tl.includes("omega") || tl.includes("fullmanhwa");
          if (want === "manhua") return tl.includes("manhua");
          if (want === "manga") return tl.includes("manga") || tl.includes("mangadex") || tl.includes("komik");
          return true;
        });
      }
      // genre: cocokkan nama di x.genres (array/string) — jika item tanpa genre, tetap tampil
      if (filters.genres && filters.genres.length) {
        const gs = filters.genres.map((g: string) => g.toLowerCase());
        list = list.filter((x: any) => {
          const raw = x.genres || x.tags || [];
          const arr = Array.isArray(raw) ? raw : [raw];
          const names = arr.map((g: any) => String(g?.name || g || "").toLowerCase());
          if (!names.length || names.every((n: string) => !n)) return true; // no genre data = jangan buang
          return gs.some((g: string) => names.some((n: string) => n.includes(g)));
        });
      }

      if (filters.status !== "all") {
        const s = filters.status.toLowerCase();
        list = list.filter((x) => {
          const st = (x.statusLabel || "").toLowerCase();
          if (s === "completed") {
            return st.includes("tamat") || st.includes("completed");
          }
          return st.includes(s);
        });
      }
      if (filters.sort === "az") {
        list = [...list].sort((a, b) => a.title.localeCompare(b.title));
      }

      const start = (filters.page - 1) * PAGE_SIZE;
      const pageItems = list.slice(start, start + PAGE_SIZE);
      setItems(pageItems);
      setHasMore(start + PAGE_SIZE < list.length);
    } catch (e: any) {
      setErr(e?.message || "fetch failed");
      setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0c]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link href="/tools/baca-komik" className="text-xs text-zinc-500">
            ← Beranda
          </Link>
          <h1 className="flex-1 text-sm font-bold">Katalog</h1>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/10 lg:hidden"
            onClick={() => setDrawer(true)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
          </button>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari judul..."
              className="w-full rounded-2xl bg-zinc-900 py-2.5 pl-10 pr-10 text-sm outline-none ring-1 ring-white/10 focus:ring-violet-500/40"
            />
            {searchInput ? (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                onClick={() => {
                  setSearchInput("");
                  setFilters({ q: "", page: 1 });
                }}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-5">
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          variant="sidebar"
        />

        <main className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between text-xs text-zinc-500">
            <span>
              {loading ? "Memuat..." : items.length + " judul"}
              {filters.genres.length > 0
                ? " · " + filters.genres.length + " genre"
                : ""}
            </span>
            <span>Hal. {filters.page}</span>
          </div>

          {err ? (
            <p className="mb-4 rounded-xl bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-300">
              {err}
            </p>
          ) : null}

          {loading ? (
            <CatalogSkeleton />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-4xl opacity-40">📭</p>
              <p className="mt-3 text-sm font-semibold text-zinc-300">
                Tidak ada komik
              </p>
              <p className="mt-1 max-w-xs text-xs text-zinc-600">
                Coba ubah filter atau kata kunci pencarian.
              </p>
              <button
                type="button"
                onClick={() =>
                  setFilters({
                    type: "all",
                    status: "all",
                    demographic: "all",
                    genres: [],
                    q: "",
                    page: 1,
                  })
                }
                className="mt-4 rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white"
              >
                Reset filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {items.map((item) => (
                <CatalogCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {!loading && items.length > 0 ? (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={filters.page <= 1}
                onClick={() => setFilters({ page: filters.page - 1 })}
                className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold ring-1 ring-white/10 disabled:opacity-30"
              >
                ← Prev
              </button>
              <span className="text-xs text-zinc-500">
                Halaman {filters.page}
              </span>
              <button
                type="button"
                disabled={!hasMore}
                onClick={() => setFilters({ page: filters.page + 1 })}
                className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold ring-1 ring-white/10 disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          ) : null}
        </main>
      </div>

      {drawer ? (
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          onClose={() => setDrawer(false)}
          variant="drawer"
        />
      ) : null}
    </div>
  );
}
