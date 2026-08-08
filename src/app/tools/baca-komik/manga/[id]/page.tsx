"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { addBookmark } from "@/lib/bookmarkStorage";

interface Manga {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  status: string;
  tags: string[];
}
interface Chapter {
  id: string;
  chapter: string | null;
  title: string | null;
}

export default function MangaDetailPage({ params }: { params: { id: string } }) {
  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/manga/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setManga(data.manga);
        setChapters(data.chapters || []);
        setLoading(false);
      });
  }, [params.id]);

  function handleBookmark() {
    if (!manga) return;
    addBookmark({
      id: crypto.randomUUID(),
      title: manga.title,
      sourceUrl: `/tools/baca-komik/manga/${manga.id}`,
      coverUrl: manga.coverUrl,
      lastChapter: null,
      addedAt: new Date().toISOString(),
    });
    setSaved(true);
  }

  if (loading) return <div className="p-8 text-center">Memuat...</div>;
  if (!manga) return <div className="p-8 text-center">Tidak ditemukan</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex gap-4">
        {manga.coverUrl && (
          <img
            src={manga.coverUrl}
            alt={manga.title}
            className="w-32 h-44 object-cover rounded-lg"
          />
        )}
        <div>
          <h1 className="text-xl font-bold">{manga.title}</h1>
          <p className="text-xs text-gray-400 mt-1">{manga.status}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {manga.tags.slice(0, 5).map((t) => (
              <span
                key={t}
                className="text-xs bg-gray-100 px-2 py-0.5 rounded"
              >
                {t}
              </span>
            ))}
          </div>
          <button
            onClick={handleBookmark}
            disabled={saved}
            className="mt-3 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saved ? "Tersimpan ✓" : "+ Bookmark"}
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600 mt-4 line-clamp-6">
        {manga.description || "Tidak ada deskripsi."}
      </p>

      <h2 className="font-semibold mt-6 mb-2">Daftar Chapter</h2>
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {chapters.length === 0 && (
          <p className="text-sm text-gray-500">Belum ada chapter (bahasa Inggris).</p>
        )}
        {chapters.map((c) => (
          <Link
            key={c.id}
            href={`/tools/baca-komik/read/${c.id}`}
            className="block text-sm p-2 bg-white border rounded hover:bg-gray-50"
          >
            Chapter {c.chapter || "?"} {c.title ? `— ${c.title}` : ""}
          </Link>
        ))}
      </div>
    </div>
  );
}
