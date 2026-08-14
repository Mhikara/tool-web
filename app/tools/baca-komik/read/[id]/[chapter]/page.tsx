"use client";
import AutoScrollBar from "@/components/baca-komik/AutoScrollBar";
import ChapterRecs from "@/components/baca-komik/ChapterRecs";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useComicStorage } from "@/lib/useComicStorage";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  RefreshCw,
} from "lucide-react";
import ComicImage from "../../../../../../components/baca-komik/ComicImage";
import { ThemeProvider, useTheme } from "../../../../../../lib/komik/theme";

type ReadData = {
  title?: string;
  pages?: string[];
  pageCount?: number;
  error?: string;
};

function ReaderInner() {
  const params = useParams();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { addHistory } = useComicStorage();
  const [chapterList, setChapterList] = useState<{ id: string; title: string }[]>([]);
  const [coverComic, setCoverComic] = useState<string | null>(null);
  const [seriesTitle, setSeriesTitle] = useState("");

  const comicId = decodeURIComponent(String(params?.id || ""));
  const chapterId = decodeURIComponent(String(params?.chapter || ""));

  const [data, setData] = useState<ReadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const q =
        "/api/komik?action=read&chapterId=" +
        encodeURIComponent(chapterId || comicId);
      const res = await fetch(q);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      if (!json.pages?.length) throw new Error("Halaman kosong");
      setData(json);
    } catch (e: any) {
      setErr(e?.message || "Gagal memuat chapter");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [comicId, chapterId]);

  useEffect(() => {
    load();
  }, [load]);

  // ambil cover + judul series untuk history
  useEffect(() => {
    if (!comicId) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          "/api/komik?action=detail&id=" + encodeURIComponent(comicId)
        );
        const j = await res.json();
        if (!alive) return;
        if (j.cover) setCoverComic(j.cover);
        if (j.title) setSeriesTitle(j.title);
        const chs = (j.chapters || []).map((c: any) => ({
          id: String(c.id || c.url || ""),
          title: String(c.title || "Chapter"),
        }));
        setChapterList(chs.filter((c: any) => c.id));
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [comicId]);


  // Reading history (standar useComicStorage)
  // history sekali per chapter (hindari infinite loop)
  useEffect(() => {
    if (!data?.pages?.length) return;
    addHistory({
      comicId,
      title: seriesTitle || data.title || comicId,
      cover: coverComic,
      chapterId,
      chapterTitle: data.title || chapterId,
    });
    // sengaja tidak memasukkan addHistory ke deps yang berubah tiap render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.pages?.length, comicId, chapterId, coverComic, seriesTitle]);


    const pages = data?.pages || [];

  const chapterNum = (id: string, title?: string) => {
    const s = `${id} ${title || ""}`;
    const m1 = s.match(/chapter[-_/ ]?(\d+(?:\.\d+)?)/i);
    if (m1) return parseFloat(m1[1]);
    const m2 = (title || "").match(/\b(\d+(?:\.\d+)?)\b/);
    return m2 ? parseFloat(m2[1]) : NaN;
  };

  // urut baca: Ch1 → Ch2 → … (bukan 94→1)
  const sortedCh = [...chapterList].sort((a, b) => {
    const na = chapterNum(a.id, a.title);
    const nb = chapterNum(b.id, b.title);
    if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
    return String(a.id).localeCompare(String(b.id));
  });

  const norm = (s: string) =>
    decodeURIComponent(String(s || ""))
      .trim()
      .toLowerCase();

  const chIndex = sortedCh.findIndex((c) => {
    const a = norm(c.id);
    const b = norm(chapterId);
    if (a === b || a.endsWith(b) || b.endsWith(a)) return true;
    const na = chapterNum(c.id, c.title);
    const nb = chapterNum(chapterId);
    return !Number.isNaN(na) && !Number.isNaN(nb) && na === nb;
  });

  const prevCh = chIndex > 0 ? sortedCh[chIndex - 1] : null;
  const nextCh =
    chIndex >= 0 && chIndex < sortedCh.length - 1
      ? sortedCh[chIndex + 1]
      : null;

  const goChapter = (id: string) => {
    router.push(
      "/tools/baca-komik/read/" +
        encodeURIComponent(comicId) +
        "/" +
        encodeURIComponent(id)
    );
  };

  const goDetail = () => {
    router.push("/tools/baca-komik/" + encodeURIComponent(comicId));
  };




  return (
    <div className="pb-24">
      {/* Top bar */}
      <header
        className={
          "sticky top-0 z-40 flex items-center gap-2 border-b px-3 py-2 backdrop-blur-md " +
          (theme === "dark"
            ? "border-zinc-800 bg-zinc-950/90"
            : "border-zinc-200 bg-white/90")
        }
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg p-2 opacity-80 hover:opacity-100"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">
            {data?.title || "Chapter"}
          </p>
          <p className="truncate text-[10px] opacity-50">
            {pages.length ? pages.length + " halaman" : "—"}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg p-2 opacity-70 hover:opacity-100"
          title="Muat ulang"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={toggle}
          className="rounded-lg p-2 opacity-70 hover:opacity-100"
          title="Tema"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </header>

      {loading && (
        <p className="p-8 text-center text-sm opacity-60">Memuat chapter…</p>
      )}
      {err && (
        <div className="mx-auto max-w-md space-y-3 p-6 text-center">
          <p className="text-sm text-amber-500">{err}</p>
          <button
            type="button"
            onClick={load}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white"
          >
            Coba lagi
          </button>
          <Link
            href={"/tools/baca-komik/" + encodeURIComponent(comicId)}
            className="block text-sm text-violet-500 underline"
          >
            Kembali ke daftar chapter
          </Link>
        </div>
      )}

      {/* Gambar sesuai chapter */}
      <div className="mx-auto flex w-full max-w-3xl flex-col">
        {pages.map((src, i) => (
          <ComicImage key={chapterId + "-" + i} src={src} index={i} />
        ))}
      </div>

      {/* Bottom nav */}
      {!loading && !err && (
        <div
          className={
            "fixed bottom-0 left-0 right-0 z-40 border-t px-4 py-3 " +
            (theme === "dark"
              ? "border-zinc-800 bg-zinc-950/95"
              : "border-zinc-200 bg-white/95")
          }
        >
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <Link
              href={"/tools/baca-komik/" + encodeURIComponent(comicId)}
              className="flex items-center gap-1 text-sm font-semibold opacity-80"
            >
              <ChevronLeft className="h-4 w-4" /> Chapter list
            </Link>
            <span className="text-xs opacity-50">
              {pages.length} halaman
            </span>
            <button
              type="button"
              onClick={() => (nextCh ? goChapter(nextCh.id) : goDetail())}
              className="flex items-center gap-1 text-sm font-semibold text-violet-500"
            >
              {nextCh ? "Lanjut →" : "Daftar"} <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-2xl gap-2 px-3 pb-28 pt-4">
        <button
          type="button"
          disabled={!prevCh}
          onClick={() => prevCh && goChapter(prevCh.id)}
          className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-semibold ring-1 ring-white/10 disabled:opacity-30"
        >
          ← Prev
        </button>
        <button
          type="button"
          onClick={() => (nextCh ? goChapter(nextCh.id) : goDetail())}
          className="flex-1 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white active:scale-[0.98]"
        >
          {nextCh ? "Chapter berikutnya →" : "Kembali ke daftar"}
        </button>
      </div>
      <AutoScrollBar />
      <ChapterRecs chapterId={chapterId} excludeId={comicId} />

    </div>
  );
}

export default function ReaderPage() {
  return (
    <ThemeProvider>
      <ReaderInner />
    </ThemeProvider>
  );
}
