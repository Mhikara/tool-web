"use client";
import { useState } from "react";
import Link from "next/link";

interface MangaResult {
  id: string;
  title: string;
  coverUrl: string | null;
  status: string;
  tags: string[];
}

export default function SearchMangaPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MangaResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    const res = await fetch(`/api/manga/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.results || []);
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1">🔍 Cari Manga/Manhwa</h1>
      <p className="text-sm text-gray-500 mb-6">
        Data & gambar disediakan resmi via MangaDex API.
      </p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Judul manga/manhwa..."
          className="flex-1 border rounded px-3 py-2"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Cari
        </button>
      </form>

      {loading && <p className="text-sm text-gray-500">Mencari...</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {results.map((m) => (
          <Link
            key={m.id}
            href={`/tools/baca-komik/manga/${m.id}`}
            className="block bg-white border rounded-lg overflow-hidden hover:shadow"
          >
            {m.coverUrl && (
              <img
                src={m.coverUrl}
                alt={m.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-2">
              <p className="text-sm font-medium line-clamp-2">{m.title}</p>
              <p className="text-xs text-gray-400 mt-1">{m.status}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
