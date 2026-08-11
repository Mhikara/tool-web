"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  getReaderPrefs,
  saveReaderPrefs,
  saveScrollProgress,
  getScrollProgress,
} from "../../../../../../lib/komik/readerPrefs";
import { useComicStorage } from "../../../../../../lib/useComicStorage";
import { fetchChapter, fetchDetail } from "../../../../../../lib/komik/api";

export default function ReaderPage() {
  const params = useParams();
  const comicId = decodeURIComponent(String(params.id || ""));
  const chapterId = decodeURIComponent(String(params.chapter || ""));
  const router = useRouter();
  
  
  const { addHistory } = useComicStorage();

  const [pages, setPages] = useState<string[]>([]);
  const [title, setTitle] = useState("Chapter");
  const [chapters, setChapters] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showBar, setShowBar] = useState(true);
  const [progress, setProgress] = useState(0);
  const [prefs, setPrefs] = useState({ fit: "width" as "width" | "full", gap: 0 });
  const lastY = useRef(0);

  useEffect(() => {
    setPrefs(getReaderPrefs());
  }, []);

  useEffect(() => {
    if (!chapterId) return;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await fetchChapter(chapterId);
        setPages(data.pages || []);
        setTitle(data.title || "Chapter");
        if (comicId) {
          try {
            const d = await fetchDetail(comicId);
            const chs = (d.chapters || []).map((c: any) => ({
              id: String(c.id || c.url),
              title: c.title || "Chapter",
            }));
            setChapters(chs);
            addHistory({
              comicId,
              title: d.title || comicId,
              cover: d.cover || null,
              chapterId,
              chapterTitle: data.title || "Chapter",
            });
            const i = chs.findIndex((c) => c.id === chapterId);
            if (i >= 0 && i < chs.length - 1) {
              fetchChapter(chs[i + 1].id).catch(() => {});
            }
          } catch {
            addHistory({
              comicId,
              title: comicId,
              chapterId,
              chapterTitle: data.title || "Chapter",
            });
          }
        }
        requestAnimationFrame(() => {
          const ratio = getScrollProgress(chapterId);
          if (ratio > 0.05 && ratio < 0.95) {
            const max =
              document.documentElement.scrollHeight - window.innerHeight;
            window.scrollTo({ top: ratio * max });
          }
        });
      } catch (e: any) {
        setErr(e.message || "Gagal memuat");
      } finally {
        setLoading(false);
        setShowBar(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, comicId]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? y / max : 0;
      setProgress(ratio);
      saveScrollProgress(chapterId, ratio);
      if (y > lastY.current + 12) setShowBar(false);
      else if (y < lastY.current - 12) setShowBar(true);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [chapterId]);

  const idx = chapters.findIndex((c) => c.id === chapterId);
  const prev = idx > 0 ? chapters[idx - 1] : null;
  const next = idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : null;

  const href = (ch: string) =>
    "/tools/baca-komik/read/" +
    encodeURIComponent(comicId) +
    "/" +
    encodeURIComponent(ch);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.key === "ArrowLeft" || e.key === "k" || e.key === "K") && prev) {
        window.location.href = href(prev.id);
      }
      if ((e.key === "ArrowRight" || e.key === "j" || e.key === "J") && next) {
        window.location.href = href(next.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, comicId]);

  const toggleFit = () => {
    const fit = prefs.fit === "width" ? "full" : "width";
    setPrefs(saveReaderPrefs({ fit }));
  };

  return (
    <div
      className="min-h-screen bg-black text-white"
      onClick={() => setShowBar((v) => !v)}
    >
      <div className="fixed left-0 right-0 top-0 z-[60] h-0.5 bg-zinc-900">
        <div
          className="h-full bg-violet-500"
          style={{ width: (progress * 100).toFixed(2) + "%" }}
        />
      </div>

      <div
        className={
          "fixed inset-x-0 top-0 z-50 flex items-center gap-2 border-b border-zinc-800 bg-zinc-950/95 px-2 py-2 backdrop-blur transition-transform " +
          (showBar ? "translate-y-0" : "-translate-y-full")
        }
        onClick={(e) => e.stopPropagation()}
      >
        <Link
          href={"/tools/baca-komik/" + encodeURIComponent(comicId)}
          className="rounded-lg p-2 hover:bg-zinc-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="text-[10px] text-zinc-500">
            {Math.round(progress * 100)}% · J/K ganti chapter
          </p>
        </div>
        <button type="button" onClick={toggleFit} className="rounded-lg p-2">
          {prefs.fit === "width" ? (
            <Maximize2 className="h-4 w-4" />
          ) : (
            <Minimize2 className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="mx-auto max-w-3xl pb-28 pt-14">
        {loading && (
          <p className="p-8 text-center text-sm text-zinc-500">Memuat...</p>
        )}
        {err && (
          <p className="p-8 text-center text-sm text-amber-400">{err}</p>
        )}
        {pages.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            loading={i < 3 ? "eager" : "lazy"}
            referrerPolicy="no-referrer"
            className={
              "mx-auto block bg-zinc-900 " +
              (prefs.fit === "width" ? "w-full max-w-3xl" : "w-auto max-w-none")
            }
            draggable={false}
          />
        ))}

        <div
          className="flex gap-3 px-3 py-6"
          onClick={(e) => e.stopPropagation()}
        >
          {prev ? (
            <Link
              href={href(prev.id)}
              className="flex flex-1 items-center justify-center rounded-xl bg-zinc-900 py-3 text-sm font-bold"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Link>
          ) : (
            <span className="flex flex-1 justify-center py-3 text-zinc-600">
              Prev
            </span>
          )}
          {next ? (
            <Link
              href={href(next.id)}
              className="flex flex-1 items-center justify-center rounded-xl bg-violet-600 py-3 text-sm font-bold"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className="flex flex-1 justify-center py-3 text-zinc-600">
              Next
            </span>
          )}
        </div>
      </div>

      <div
        className={
          "fixed inset-x-0 bottom-0 z-50 flex items-center justify-between border-t border-zinc-800 bg-zinc-950/95 px-2 py-2 backdrop-blur transition-transform " +
          (showBar ? "translate-y-0" : "translate-y-full")
        }
        onClick={(e) => e.stopPropagation()}
      >
        {prev ? (
          <Link href={href(prev.id)} className="px-3 py-2 text-sm font-semibold">
            ← Prev
          </Link>
        ) : (
          <span className="px-3 py-2 text-zinc-600">Prev</span>
        )}
        <span className="text-[11px] text-zinc-500">
          {idx >= 0 ? idx + 1 : "–"}/{chapters.length || "–"}
        </span>
        {next ? (
          <Link href={href(next.id)} className="px-3 py-2 text-sm font-semibold">
            Next →
          </Link>
        ) : (
          <span className="px-3 py-2 text-zinc-600">Next</span>
        )}
      </div>
    </div>
  );
}
