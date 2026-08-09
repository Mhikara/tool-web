"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import ComicImage from "../../../../../../components/baca-komik/ComicImage";
import { useComicStorage } from "../../../../../../lib/useComicStorage";
import { fetchChapter, fetchDetail } from "../../../../../../lib/komik/api";

export default function ReaderPage() {
  const params = useParams();
  const comicId = decodeURIComponent(String(params.id || ""));
  const chapterId = decodeURIComponent(String(params.chapter || ""));
  const { addHistory } = useComicStorage();

  const [pages, setPages] = useState<string[]>([]);
  const [title, setTitle] = useState("Chapter");
  const [comicTitle, setComicTitle] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [chapters, setChapters] = useState<{ id: string; title: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showBar, setShowBar] = useState(true);
  const lastY = useRef(0);

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
            setChapters(
              (d.chapters || []).map((c: any) => ({
                id: String(c.id || c.url),
                title: c.title || "Chapter",
              }))
            );
            setComicTitle(d.title || "");
            setCover(d.cover || null);
            addHistory({
              comicId,
              title: d.title || comicId,
              cover: d.cover || null,
              chapterId,
              chapterTitle: data.title || "Chapter",
            });
          } catch {
            addHistory({
              comicId,
              title: comicId,
              chapterId,
              chapterTitle: data.title || "Chapter",
            });
          }
        }
      } catch (e: any) {
        setErr(e.message || "Gagal memuat chapter");
      } finally {
        setLoading(false);
        window.scrollTo({ top: 0 });
        setShowBar(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, comicId]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY.current + 12) setShowBar(false);
      else if (y < lastY.current - 12) setShowBar(true);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const idx = chapters.findIndex((c) => c.id === chapterId);
  const prev = idx > 0 ? chapters[idx - 1] : null;
  const next =
    idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : null;

  const href = (ch: string) =>
    "/tools/baca-komik/read/" +
    encodeURIComponent(comicId) +
    "/" +
    encodeURIComponent(ch);

  return (
    <div
      className="min-h-screen bg-black text-white"
      onClick={() => setShowBar((v) => !v)}
    >
      {/* Top bar */}
      <div
        className={
          "fixed inset-x-0 top-0 z-50 flex items-center gap-2 border-b border-zinc-800 bg-zinc-950/95 px-2 py-2 backdrop-blur transition-transform duration-200 " +
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
          <p className="truncate text-[10px] text-zinc-500">
            {comicTitle || "Baca Komik"} · {pages.length} halaman
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-0 pb-24 pt-14 md:px-4">
        {loading && (
          <p className="p-8 text-center text-sm text-zinc-500">
            Memuat halaman...
          </p>
        )}
        {err && (
          <p className="p-8 text-center text-sm text-amber-400">{err}</p>
        )}
        {pages.map((src, i) => (
          <ComicImage
            key={i}
            src={src}
            alt={"Halaman " + (i + 1)}
            className="mx-auto block w-full max-w-3xl bg-zinc-900"
          />
        ))}

        {!loading && pages.length > 0 && (
          <div
            className="mx-auto flex max-w-3xl gap-3 px-3 py-6"
            onClick={(e) => e.stopPropagation()}
          >
            {prev ? (
              <Link
                href={href(prev.id)}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-zinc-900 py-3 text-sm font-bold hover:bg-zinc-800"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Link>
            ) : (
              <span className="flex flex-1 items-center justify-center rounded-xl bg-zinc-900/40 py-3 text-sm text-zinc-600">
                Prev
              </span>
            )}
            {next ? (
              <Link
                href={href(next.id)}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-violet-600 py-3 text-sm font-bold hover:bg-violet-500"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="flex flex-1 items-center justify-center rounded-xl bg-zinc-900/40 py-3 text-sm text-zinc-600">
                Next
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom floating bar */}
      <div
        className={
          "fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-2 border-t border-zinc-800 bg-zinc-950/95 px-2 py-2 backdrop-blur transition-transform duration-200 " +
          (showBar ? "translate-y-0" : "translate-y-full")
        }
        onClick={(e) => e.stopPropagation()}
      >
        {prev ? (
          <Link
            href={href(prev.id)}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-zinc-900"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Link>
        ) : (
          <span className="px-3 py-2 text-sm text-zinc-600">Prev</span>
        )}
        <Link
          href={"/tools/baca-komik/" + encodeURIComponent(comicId)}
          className="truncate text-xs text-zinc-400"
        >
          Daftar chapter
        </Link>
        {next ? (
          <Link
            href={href(next.id)}
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
