"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getBookmarks, Bookmark } from "@/lib/bookmarkStorage";

interface MangaResult {
  id: string;
  title: string;
  coverUrl: string | null;
  status: string;
  originalLanguage: string;
}

export default function MangaDexCatalogPage() {
  const [results, setResults] = useState<MangaResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"all" | "ongoing" | "completed">("all");
  const [sort, setSort] = useState<"latest" | "popular" | "rating">("popular");
  const [favorites, setFavorites] = useState<Bookmark[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    setFavorites(getBookmarks());
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/manga/catalog?status=${status}&sort=${sort}`)
      .then((res) => res.json())
      .then((data) => {
        setResults(data.results || []);
        setLoading(false);
      });
  }, [status, sort]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">📖 Baca Komik — MangaDex</h1>
        <button
          onClick={() => setShowFavorites((s) => !s)}
          className="text-sm bg-pink-100 text-pink-700 px-3 py-1.5 rounded-full"
        >
          ❤️ Favorit ({favorites.length})
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Katalog & pembacaan resmi via MangaDex API.
      </p>

      {showFavorites ? (
        <FavoritesView favorites={favorites} />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            <Link
              href="/tools/baca-komik/search"
              className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700"
            >
              🔍 Cari Judul
            </Link>
            <FilterButton
              options={[
                { value: "all", label: "Semua Status" },
                { value: "ongoing", label: "Ongoing" },
                { value: "completed", label: "Tamat" },
              ]}
              value={status}
              onChange={(v) => setStatus(v as any)}
            />
            <FilterButton
              options={[
                { value: "popular", label: "Terpopuler" },
                { value: "latest", label: "Terbaru" },
                { value: "rating", label: "Rating" },
              ]}
              value={sort}
              onChange={(v) => setSort(v as any)}
            />
          </div>

          <p className="text-xs text-gray-400 mb-3">{results.length} judul</p>

          {loading ? (
            <p className="text-sm text-gray-500">Memuat...</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-gray-500">Tidak ada hasil.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {results.map((m) => (
                <Link
                  key={m.id}
                  href={`/tools/baca-komik/manga/${m.id}`}
                  className="block bg-white border rounded-lg overflow-hidden hover:shadow"
                >
                  {m.coverUrl && (
                    <img src={m.coverUrl} alt={m.title} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-2">
                    <p className="text-xs font-medium line-clamp-2">{m.title}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{m.status}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterButton({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-full p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`text-xs px-3 py-1 rounded-full ${
            value === opt.value ? "bg-white shadow font-medium" : "text-gray-500"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function FavoritesView({ favorites }: { favorites: Bookmark[] }) {
  if (favorites.length === 0) {
    return <p className="text-sm text-gray-500">Belum ada favorit tersimpan.</p>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {favorites.map((b) => (
        <Link
          key={b.id}
          href={b.sourceUrl}
          className="block bg-white border rounded-lg overflow-hidden hover:shadow"
        >
          {b.coverUrl && (
            <img src={b.coverUrl} alt={b.title} className="w-full h-40 object-cover" />
          )}
          <div className="p-2">
            <p className="text-xs font-medium line-clamp-2">{b.title}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
