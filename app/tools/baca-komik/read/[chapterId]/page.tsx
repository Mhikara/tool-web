"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { fetchChapter, fetchDetail } from "../../../../../lib/komik/api";
import { pushHistory } from "../../../../../lib/komik/storage";

export default function ReaderPage() {
  const params = useParams();
  const sp = useSearchParams();
  const chapterId = decodeURIComponent(String(params.chapterId || ""));
  const comicId = sp.get("comic") || "";
  const titleParam = sp.get("title") || "Chapter";

  const [pages, setPages] = useState<string[]>([]);
  const [title, setTitle] = useState(titleParam);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showBar, setShowBar] = useState(true);
  const [fitWidth, setFitWidth] = useState(true);
  const [chapters, setChapters] = useState<{ id: string; title: string }[]>([]);
  const lastY = useRef(0);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchChapter(chapterId);
      setPages(data.pages || []);
      setTitle(data.title || titleParam);
      if (comicId) {
        pushHistory({
          comicId,
          title: titleParam,
          chapterId,
          chapterTitle: data.title || titleParam,
          at: Date.now(),
        });
        try {
          const d = await fetchDetail(comicId);
          setChapters(d.chapters || []);
        } catch {
          /* optional */
        }
      }
    } catch (e: any) {
      setErr(e.message || "Gagal memuat chapter");
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0 });
    }
  };

  useEffect(() => {
    if (chapterId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY.current + 8) setShowBar(false);
      else if (y < lastY.current - 8) setShowBar(true);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const idx = chapters.findIndex((c) => c.id === chapterId);
  const prev = idx > 0 ? chapters[idx - 1] : null;
  const next = idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : null;

  const hrefChapter = (id: string, t: string) =>
    "/tools/baca-komik/read/" +
    encodeURIComponent(id) +
    "?comic=" +
    encodeURIComponent(comicId) +
    "&title=" +
    encodeURIComponent(t);

  return (
    <div
      className="min-h-screen bg-black text-white"
      onClick={() => setShowBar((v) => !v)}
    >
      <div
        className={
          "fixed inset-x-0 top-0 z-50 flex items-center gap-2 border-b border-zinc-800 bg-zinc-950/95 px-2 py-2 backdrop-blur transition " +
          (showBar ? "translate-y-0" : "-translate-y-full")
        }
        onClick={(e) => e.stopPropagation()}
      >
        <Link
          href={
            comicId
              ? "/tools/baca-komik/" + encodeURIComponent(comicId)
              : "/tools/baca-komik"
          }
          className="rounded-lg p-2 hover:bg-zinc-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="text-[10px] text-zinc-500">{pages.length} halaman</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg p-2 hover:bg-zinc-900"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setFitWidth((v) => !v)}
          className="rounded-lg px-2 py-1 text-[10px] font-bold uppercase text-zinc-300 hover:bg-zinc-900"
        >
          {fitWidth ? "Fit" : "Full"}
        </button>
      </div>

      <div className="mx-auto max-w-3xl pt-14 pb-20">
        {loading && (
          <p className="p-6 text-center text-sm text-zinc-500">Memuat halaman...</p>
        )}
        {err && (
          <p className="p-6 text-center text-sm text-amber-400">{err}</p>
        )}
        {pages.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt={"Halaman " + (i + 1)}
            loading="lazy"
            className={
              "mx-auto block bg-zinc-900 " +
              (fitWidth ? "w-full" : "w-auto max-w-none")
            }
            draggable={false}
          />
        ))}
      </div>

      <div
        className={
          "fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-2 border-t border-zinc-800 bg-zinc-950/95 px-2 py-2 backdrop-blur transition " +
          (showBar ? "translate-y-0" : "translate-y-full")
        }
        onClick={(e) => e.stopPropagation()}
      >
        {prev ? (
          <Link
            href={hrefChapter(prev.id, prev.title)}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-zinc-900"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Link>
        ) : (
          <span className="px-3 py-2 text-sm text-zinc-600">Prev</span>
        )}

        {chapters.length > 0 ? (
          <div className="relative min-w-0 flex-1">
            <select
              className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-3 pr-8 text-xs"
              value={chapterId}
              onChange={(e) => {
                const ch = chapters.find((c) => c.id === e.target.value);
                if (ch) window.location.href = hrefChapter(ch.id, ch.title);
              }}
            >
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          </div>
        ) : (
          <span className="flex-1 text-center text-xs text-zinc-500">Chapter</span>
        )}

        {next ? (
          <Link
            href={hrefChapter(next.id, next.title)}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-zinc-900"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="px-3 py-2 text-sm text-zinc-600">Next</span>
        )}
      </div>
    </div>
  );
}
