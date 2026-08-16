"use client";
import dynamic from "next/dynamic";
const TranslateBlock = dynamic(
  () => import("@/components/baca-komik/TranslateBlock"),
  { ssr: false, loading: () => null }
);

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowUpDown,
  Bookmark,
  BookmarkCheck,
  Play,
  SkipForward,
} from "lucide-react";
import { useComicStorage } from "../../../../lib/useComicStorage";
import { fetchDetail, type ChapterItem } from "../../../../lib/komik/api";

export default function ComicDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(String(params.id || ""));
  const { isBookmarked, toggleBookmark, isChapterRead } = useComicStorage();

  const [title, setTitle] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [statusLabel, setStatusLabel] = useState("");
  const [colorLabel, setColorLabel] = useState("");
  const [source, setSource] = useState("");
  const [note, setNote] = useState("");
  const [external, setExternal] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [asc, setAsc] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const d = await fetchDetail(id);
        setTitle(d.title || id);
        setCover(d.cover || null);
        setStatusLabel(d.statusLabel || "");
        setColorLabel(d.colorLabel || "");
        setSource(d.source || "");
        setNote(d.note || d.synopsis || "");
        setExternal(d.external || "");
        setChapters(
          (d.chapters || []).map((c: any, i: number) => ({
            id: String(c.id || c.url),
            title: c.title || "Chapter",
            url: String(c.url || c.id),
            index: i,
            paid: c.paid,
          }))
        );
      } catch (e: any) {
        setErr(e.message || "Gagal");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const list = useMemo(() => {
    let rows = [...chapters];
    if (q.trim()) {
      const qq = q.toLowerCase();
      rows = rows.filter((c) => c.title.toLowerCase().includes(qq));
    }
    if (!asc) rows = [...rows].reverse();
    return rows;
  }, [chapters, q, asc]);

  const first = chapters[0];
  const last = chapters[chapters.length - 1];
  const booked = isBookmarked(id);

  const readHref = (chapterId: string) =>
    "/tools/baca-komik/read/" +
    encodeURIComponent(id) +
    "/" +
    encodeURIComponent(chapterId);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="relative overflow-hidden border-b border-zinc-800">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover opacity-30 blur-md"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-zinc-950/50" />
        <div className="relative mx-auto flex max-w-6xl gap-4 px-3 py-6 sm:px-4">
          <Link
            href="/tools/baca-komik"
            className="absolute left-3 top-3 text-xs text-zinc-400 hover:text-white"
          >
            ← Katalog
          </Link>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={title}
              referrerPolicy="no-referrer"
              className="mt-6 h-44 w-32 shrink-0 rounded-xl object-cover shadow-2xl sm:h-56 sm:w-40"
            />
          ) : (
            <div className="mt-6 flex h-44 w-32 items-center justify-center rounded-xl bg-zinc-800 sm:h-56 sm:w-40">
              📖
            </div>
          )}
          <div className="mt-6 min-w-0 flex-1">
            <h1 className="text-xl font-bold sm:text-3xl">{title || "Memuat..."}</h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {statusLabel && (
                <span className="rounded-full bg-violet-600/20 px-2 py-0.5 text-violet-300">
                  {statusLabel}
                </span>
              )}
              {colorLabel && (
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-300">
                  {colorLabel}
                </span>
              )}
              {source && (
                <span className="rounded-full bg-sky-600/20 px-2 py-0.5 text-sky-300">
                  {source}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              {chapters.length} chapter
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {first && (
                <Link
                  href={readHref(first.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-sm font-bold text-white hover:bg-violet-500"
                >
                  <Play className="h-4 w-4" /> Mulai baca (Ch. 1)
                </Link>
              )}
              {last && last.id !== first?.id && (
                <Link
                  href={readHref(last.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2 text-sm font-semibold"
                >
                  <SkipForward className="h-4 w-4" /> Chapter terbaru
                </Link>
              )}
              <button
                type="button"
                onClick={() =>
                  toggleBookmark({
                    id,
                    title: title || id,
                    cover,
                    source,
                    statusLabel,
                  })
                }
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
            {external && (
              <a
                href={external}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm text-violet-400"
              >
                Buka di sumber →
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4">
        {note ? (
          <div className="mb-5">
            <TranslateBlock text={note} label="Sinopsis" />
          </div>
        ) : null}
        {loading && <p className="text-sm text-zinc-500">Memuat chapter...</p>}
        {err && <p className="text-sm text-amber-400">{err}</p>}

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="mr-auto font-bold">Daftar chapter</h2>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari no. chapter..."
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm outline-none focus:border-violet-500"
          />
          <button
            type="button"
            onClick={() => setAsc((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 px-2 py-1.5 text-xs font-semibold"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {asc ? "1 → Max" : "Max → 1"}
          </button>
        </div>

        <div className="divide-y divide-zinc-800 overflow-hidden rounded-2xl border border-zinc-800">
          {list.map((c) => {
            const read = isChapterRead(c.id);
            return (
              <Link
                key={c.id}
                href={readHref(c.id)}
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
          {!loading && list.length === 0 && (
            <p className="p-4 text-sm text-zinc-500">Tidak ada chapter.</p>
          )}
        </div>
      </div>
    </div>
  );
}
