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
  return (raw || [])
    .map((x) => ({
      id: String(x.id || x.url || ""),
      title: String(x.title || "")
        .replace(/^Baca\s+Komik\s+/i, "")
        .trim() || "Tanpa judul",
      cover: x.cover || null,
      latestChapter: x.latestChapter || x.statusLabel || null,
      statusLabel: x.statusLabel || null,
      rating: x.rating ?? null,
      updatedAt: x.updatedAt || x.updated_at || null,
      source: x.source || "",
    }))
    .filter((x) => x.id);
}

function mergeUnique(...lists: Item[][]): Item[] {
  const seen = new Set<string>();
  const out: Item[] = [];
  for (const list of lists) {
    for (const it of list) {
      if (seen.has(it.id)) continue;
      seen.add(it.id);
      out.push(it);
    }
  }
  return out;
}

const SOURCES = [
  ["all", "Semua"],
    ["fullmanhwa", "FullManhwa"],
  ["komiku", "Komiku"],
  ["omega", "Omega"],
  ["mangadex", "MangaDex"],
] as const;

export default function HomeClient() {
  const { readingHistory } = useComicStorage();
  const [latest, setLatest] = useState<Item[]>([]);
  const [popular, setPopular] = useState<Item[]>([]);
  const [hero, setHero] = useState<Item[]>([]);
  const [period, setPeriod] = useState("all");
  const [source, setSource] = useState("all");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [liveAt, setLiveAt] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      if (source === "all") {
        // Ambil paralel supaya judul Komiku + FullManhwa pasti masuk
        const [km, fm, md, om] = await Promise.all([
          fetch("/api/komik?action=home&source=komiku").then((r) => r.json()),
          fetch("/api/komik?action=home&source=fullmanhwa").then((r) => r.json()),
          fetch("/api/komik?action=home&source=mangadex").then((r) => r.json()),
          fetch("/api/komik?action=home&source=omega").then((r) => r.json()),
        ]);

        const kmL = mapList(km.latest || km.list || []);
        const fmL = mapList(fm.latest || fm.list || []);
        const mdL = mapList(md.latest || md.list || []);
        const omL = mapList(om.latest || om.list || []);
        const mdP = mapList(md.popular || md.topRated || []);

        setCounts({
          komiku: kmL.length,
          fullmanhwa: fmL.length,
          mangadex: mdL.length,
          omega: omL.length,
        });

        // interleave judul dari semua sumber
        const merged: Item[] = [];
        const seen = new Set<string>();
        let i = 0;
        const buckets = [fmL, kmL, omL, mdL];
        while (merged.length < 40) {
          let added = false;
          for (const b of buckets) {
            if (i < b.length && !seen.has(b[i].id)) {
              seen.add(b[i].id);
              merged.push(b[i]);
              added = true;
            }
          }
          if (!added) break;
          i++;
        }

        setLatest(merged);
        setPopular(mergeUnique(mdP, fmL, omL).slice(0, 16));
        setHero(
          mergeUnique(mdP, fmL, kmL, omL)
            .filter((x) => x.cover)
            .slice(0, 8)
        );
      } else {
        const data = await fetch(
          "/api/komik?action=home&source=" + encodeURIComponent(source)
        ).then((r) => r.json());
        const list = mapList(data.latest || data.list || []);
        const pop = mapList(data.popular || data.topRated || list);
        setCounts({ [source]: list.length });
        setLatest(list);
        setPopular(pop.slice(0, 16));
        setHero(list.filter((x) => x.cover).slice(0, 8));
      }
      setLiveAt(new Date().toLocaleTimeString("id-ID"));
    } catch (e: any) {
      setErr(e?.message || "Gagal memuat");
    } finally {
      setLoading(false);
    }
  }, [source]);

  useEffect(() => {
    load();
    const t = setInterval(load, 120000);
    return () => clearInterval(t);
  }, [load]);

  const popularView = (() => {
    if (period === "all") return popular;
    const seed = period === "day" ? 1 : period === "week" ? 7 : 30;
    return [...popular]
      .map((it, i) => ({ it, k: (seed * 17 + i * 13) % 97 }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.it);
  })();

  return (
    <div className="min-h-screen bg-[#0b0b0f] pb-24 text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0b0b0f]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-2 px-3 py-3">
          <div className="flex-1">
            <span className="text-lg font-black tracking-tight">
              <span className="text-white">BACA</span>
              <span className="text-red-500">KOMIK</span>
            </span>
          </div>
          <Link
            href="/tools/baca-komik/library"
            className="rounded-full p-2 text-zinc-400"
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

        <div className="mx-3 flex items-center justify-between text-[10px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            Live
            {counts.komiku != null && (
              <span className="text-zinc-600">
                · KM {counts.komiku || 0} · FM {counts.fullmanhwa || 0}
              </span>
            )}
          </span>
          <button type="button" onClick={load} className="text-zinc-400">
            {loading ? "Memuat…" : "Refresh · " + liveAt}
          </button>
        </div>

        {/* Filter sumber — judul Komiku & FullManhwa */}
        <div className="mx-3 flex gap-2 overflow-x-auto pb-1">
          {SOURCES.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSource(id)}
              className={
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold " +
                (source === id
                  ? "bg-white text-zinc-900"
                  : "bg-zinc-900 text-zinc-400 ring-1 ring-white/10")
              }
            >
              {label}
            </button>
          ))}
        </div>

        <ContinueStrip items={readingHistory} />
        <HeroCarousel items={hero.length ? hero : popular} />
        <UpdateList
          title={
            source === "komiku"
              ? "Komiku — Update"
              : source === "fullmanhwa"
                ? "FullManhwa — Update"
                : "Update Terbaru"
          }
          items={latest}
        />
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
