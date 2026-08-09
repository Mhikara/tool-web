"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowUpDown, Bookmark, BookmarkCheck, Play } from "lucide-react";
import KomikNavbar from "../../../../components/komik/Navbar";
import { fetchDetail } from "../../../../lib/komik/api";
import {
  isBookmarked,
  isChapterRead,
  toggleBookmark,
} from "../../../../lib/komik/storage";
import type { ChapterItem, ComicDetail } from "../../../../lib/komik/types";

export default function ComicDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(String(params.id || ""));
  const [data, setData] = useState<ComicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [booked, setBooked] = useState(false);
  const [q, setQ] = useState("");
  const [asc, setAsc] = useState(true);
  const [openSyn, setOpenSyn] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const d = await fetchDetail(id);
        setData(d);
        setBooked(isBookmarked(id));
      } catch (e: any) {
        setErr(e.message || "Gagal");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const chapters = useMemo(() => {
    let list = [...(data?.chapters || [])];
    if (q.trim()) {
      const qq = q.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(qq));
    }
    if (!asc) list.reverse();
    return list;
  }, [data, q, asc]);

  const first = data?.chapters?.[0];
  const last = data?.chapters?.[data.chapters.length - 1];

  const onBookmark = () => {
    const next = toggleBookmark({
      id,
      title: data?.title || id,
      url: id,
      cover: data?.cover || null,
      statusLabel: data?.statusLabel,
      colorLabel: data?.colorLabel,
      source: data?.source,
    });
    setBooked(next);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <KomikNavbar active="katalog" />
      {loading && <p className="p-4 text-sm text-zinc-500">Memuat detail...</p>}
      {err && <p className="p-4 text-sm text-amber-400">{err}</p>}
      {data && (
        <>
          <div className="relative overflow-hidden border-b border-zinc-800">
            {data.cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.cover}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-30 blur-md"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/40" />
            <div className="relative mx-auto flex max-w-6xl gap-4 px-3 py-6 sm:px-4">
              {data.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.cover}
                  alt={data.title}
                  className="h-40 w-28 shrink-0 rounded-xl object-cover shadow-2xl sm:h-52 sm:w-36"
                />
              ) : (
                <div className="flex h-40 w-28 items-center justify-center rounded-xl bg-zinc-800 sm:h-52 sm:w-36">
                  📖
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold sm:text-2xl">{data.title}</h1>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {data.statusLabel && (
                    <span className="rounded-full bg-violet-600/20 px-2 py-0.5 text-violet-300">
                      {data.statusLabel}
                    </span>
                  )}
                  {data.colorLabel && (
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-300">
                      {data.colorLabel}
                    </span>
                  )}
                  {data.source && (
                    <span className="rounded-full bg-sky-600/20 px-2 py-0.5 text-sky-300">
                      {data.source}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm text-zinc-400">
                  {data.totalChapters ?? data.chapters.length} chapter
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {first && (
                    <Link
                      href={
                        "/tools/baca-komik/read/" +
                        encodeURIComponent(first.id) +
                        "?comic=" +
                        encodeURIComponent(id) +
                        "&title=" +
                        encodeURIComponent(first.title)
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-sm font-bold text-white hover:bg-violet-500"
                    >
                      <Play className="h-4 w-4" /> Mulai baca
                    </Link>
                  )}
                  {last && last.id !== first?.id && (
                    <Link
                      href={
                        "/tools/baca-komik/read/" +
                        encodeURIComponent(last.id) +
                        "?comic=" +
                        encodeURIComponent(id) +
                        "&title=" +
                        encodeURIComponent(last.title)
                      }
                      className="inline-flex rounded-xl border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-200"
                    >
                      Chapter terbaru
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={onBookmark}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2 text-sm font-semibold"
                  >
                    {booked ? (
                      <BookmarkCheck className="h-4 w-4 text-violet-400" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                    {booked ? "Tersimpan" : "Bookmark"}
                  </button>
                </div>
                {data.external && (
                  <a
                    href={data.external}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm text-violet-400"
                  >
                    Buka di situs sumber →
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4">
            {(data.synopsis || data.note) && (
              <section className="mb-6">
                <h2 className="mb-2 font-bold">Sinopsis</h2>
                <p
                  className={
                    "text-sm leading-relaxed text-zinc-400 " +
                    (openSyn ? "" : "line-clamp-3")
                  }
                >
                  {data.synopsis || data.note}
                </p>
                <button
                  type="button"
                  onClick={() => setOpenSyn((v) => !v)}
                  className="mt-1 text-xs font-semibold text-violet-400"
                >
                  {openSyn ? "Sembunyikan" : "Baca selengkapnya"}
                </button>
              </section>
            )}

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="mr-auto font-bold">Daftar chapter</h2>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari chapter..."
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm outline-none focus:border-violet-500"
              />
              <button
                type="button"
                onClick={() => setAsc((v) => !v)}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 px-2 py-1.5 text-xs font-semibold text-zinc-300"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                {asc ? "Naik" : "Turun"}
              </button>
            </div>

            <div className="divide-y divide-zinc-800 overflow-hidden rounded-2xl border border-zinc-800">
              {chapters.map((c: ChapterItem) => {
                const read = isChapterRead(c.id);
                return (
                  <Link
                    key={c.id}
                    href={
                      "/tools/baca-komik/read/" +
                      encodeURIComponent(c.id) +
                      "?comic=" +
                      encodeURIComponent(id) +
                      "&title=" +
                      encodeURIComponent(c.title)
                    }
                    className={
                      "flex items-center justify-between px-3 py-3 text-sm transition hover:bg-zinc-900 " +
                      (read ? "text-zinc-500" : "text-zinc-100")
                    }
                  >
                    <span>
                      {c.title}
                      {c.paid ? " 🔒" : ""}
                    </span>
                    <span className="text-xs text-zinc-600">
                      {read ? "Dibaca" : "Baca"}
                    </span>
                  </Link>
                );
              })}
              {!chapters.length && (
                <p className="p-4 text-sm text-zinc-500">Tidak ada chapter.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
