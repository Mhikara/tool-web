"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, Heart } from "lucide-react";
import BottomNav from "@/components/baca-komik/BottomNav";
import HeroCarousel from "@/components/baca-komik/HeroCarousel";
import UpdateList from "@/components/baca-komik/UpdateList";
import PopularStrip from "@/components/baca-komik/PopularStrip";
import ContinueStrip from "@/components/baca-komik/ContinueStrip";
import { useComicStorage } from "@/lib/useComicStorage";

type Item = {
  id: string;
  title: string;
  cover?: string | null;
  latestChapter?: string | null;
  statusLabel?: string | null;
  rating?: number | string | null;
  updatedAt?: string | null;
  source?: string;
};

function mapList(raw: any[]): Item[] {
  return (raw || []).map((x) => ({
    id: String(x.id || x.url),
    title: x.title || "Tanpa judul",
    cover: x.cover || null,
    latestChapter: x.latestChapter || x.statusLabel || null,
    statusLabel: x.statusLabel || null,
    rating: x.rating ?? null,
    updatedAt: x.updatedAt || x.updated_at || null,
    source: x.source,
  }));
}

export default function HomeClient() {
  const { readingHistory } = useComicStorage();
  const [latest, setLatest] = useState<Item[]>([]);
  const [popular, setPopular] = useState<Item[]>([]);
  const [hero, setHero] = useState<Item[]>([]);
  const [period, setPeriod] = useState("all");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [liveAt, setLiveAt] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      // live: campur sumber + popular dari mangadex
      const [homeAll, homeMd] = await Promise.all([
        fetch("/api/komik?action=home&source=all").then((r) => r.json()),
        fetch("/api/komik?action=home&source=mangadex").then((r) => r.json()),
      ]);
      const lat = mapList([
        ...(homeAll.latest || homeAll.list || []),
        ...(homeMd.latest || []),
      ]);
      // unique by id
      const seen = new Set<string>();
      const uniqLat: Item[] = [];
      for (const it of lat) {
        if (seen.has(it.id)) continue;
        seen.add(it.id);
        uniqLat.push(it);
      }

      const pop = mapList([
        ...(homeMd.popular || []),
        ...(homeAll.popular || []),
        ...(homeMd.topRated || []),
      ]);
      const seenP = new Set<string>();
      const uniqPop: Item[] = [];
      for (const it of pop) {
        if (seenP.has(it.id)) continue;
        seenP.add(it.id);
        uniqPop.push(it);
      }

      // hero = mix popular + latest yang punya cover
      const heroPool = [...uniqPop, ...uniqLat].filter((x) => x.cover);
      setHero(heroPool.slice(0, 8));
      setLatest(uniqLat.slice(0, 16));
      setPopular(uniqPop.slice(0, 16));
      setLiveAt(new Date().toLocaleTimeString("id-ID"));
    } catch (e: any) {
      setErr(e?.message || "Gagal memuat");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // refresh live tiap 2 menit
    const t = setInterval(load, 120000);
    return () => clearInterval(t);
  }, [load]);

  // period filter (client shuffle ringan untuk harian/mingguan)
  const popularView = (() => {
    if (period === "all") return popular;
    const copy = [...popular];
    // deterministic shuffle by period seed
    const seed = period === "day" ? 1 : period === "week" ? 7 : 30;
    return copy
      .map((it, i) => ({ it, k: (seed * 17 + i * 13) % 97 }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.it);
  })();

  return (
    <div className="min-h-screen bg-[#0b0b0f] pb-24 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0b0b0f]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-2 px-3 py-3">
          <div className="flex flex-1 items-center gap-2">
            <span className="text-lg font-black tracking-tight">
              <span className="text-white">BACA</span>
              <span className="text-red-500">KOMIK</span>
            </span>
          </div>
          <Link
            href="/tools/baca-komik/library"
            className="rounded-full p-2 text-zinc-400 hover:text-white"
          >
            <Heart className="h-5 w-5" />
          </Link>
        </div>
        <div className="mx-auto max-w-lg px-3 pb-3">
          <Link
            href="/tools/baca-komik/katalog"
            className="flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-2.5 text-sm text-zinc-500 ring-1 ring-white/10"
          >
            <Search className="h-4 w-4" />
            Cari manga...
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-6 py-4">
        {err && (
          <p className="mx-3 rounded-xl bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-300">
            {err}
          </p>
        )}

        {/* Live badge */}
        <div className="mx-3 flex items-center justify-between text-[10px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            Live update
          </span>
          <button type="button" onClick={load} className="text-zinc-400">
            {loading ? "Memuat…" : "Refresh · " + liveAt}
          </button>
        </div>

        <ContinueStrip items={readingHistory} />

        <HeroCarousel items={hero.length ? hero : popular} />

        <UpdateList title="Update Terbaru" items={latest} />

        <PopularStrip
          items={popularView}
          period={period}
          onPeriod={setPeriod}
        />
      </div>

      <BottomNav />
    </div>
  );
}
