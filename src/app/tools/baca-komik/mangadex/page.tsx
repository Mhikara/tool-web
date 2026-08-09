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

interface TagOption {
  id: string;
  name: string;
  group: string;
}

export default function MangaDexCatalogPage() {
  const [results, setResults] = useState<MangaResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"all" | "ongoing" | "completed">("all");
  const [sort, setSort] = useState<"latest" | "popular" | "rating">("popular");
  const [favorites, setFavorites] = useState<Bookmark[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  const [allTags, setAllTags] = useState<TagOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showGenrePanel, setShowGenrePanel] = useState(false);

  useEffect(() => {
    setFavorites(getBookmarks());
    fetch("/api/manga/tags")
      .then((res) => res.json())
      .then((data) => setAllTags(data.tags || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const tagsQuery = selectedTags.length > 0 ? `&tags=${selectedTags.join(",")}` : "";
    fetch(`/api/manga/catalog?status=${status}&sort=${sort}${tagsQuery}`)
      .then((res) => res.json())
      .then((data) => {
        setResults(data.results || []);
        setLoading(false);
      });
  }, [status, sort, selectedTags]);

  function toggleTag(id: string) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

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
          <div className="flex flex-wrap gap-2 mb-3">
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
            <button
              onClick={() => setShowGenrePanel((s) => !s)}
              className={`text-xs px-3 py-1.5 rounded-full ${
                selectedTags.length > 0
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              🏷️ Genre {selectedTags.length > 0 ? `(${selectedTags.length})` : ""}
            </button>
          </div>

          {showGenrePanel && (
            <div className="mb-4 p-3 bg-white border rounded-lg max-h-56 overflow-y-auto">
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border ${
                      selectedTags.includes(tag.id)
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-gray-600 border-gray-200"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="mt-2 text-xs text-red-500 underline"
                >
                  Reset genre
                </button>
              )}
            </div>
          )}

          <p className="text-xs text-gray-400 mb-3">{results.length} judul</p>

          {loading ? (
            <p className="text-sm text-gray-500">Memuat...</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-gray-500">Tidak ada hasil untuk filter ini.</p>
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
