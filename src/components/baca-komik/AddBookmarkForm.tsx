"use client";
import { useState } from "react";
import { addBookmark } from "@/lib/bookmarkStorage";

export default function AddBookmarkForm({ onAdded }: { onAdded: () => void }) {
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [lastChapter, setLastChapter] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !sourceUrl.trim()) return;

    addBookmark({
      id: crypto.randomUUID(),
      title: title.trim(),
      sourceUrl: sourceUrl.trim(),
      coverUrl: coverUrl.trim() || null,
      lastChapter: lastChapter.trim() || null,
      addedAt: new Date().toISOString(),
    });

    setTitle("");
    setSourceUrl("");
    setCoverUrl("");
    setLastChapter("");
    onAdded();
  }

  function searchOnManhwaDesu() {
    if (!title.trim()) {
      alert("Isi judul dulu sebelum cari");
      return;
    }
    const url = `https://manhwadesu.im/?s=${encodeURIComponent(title.trim())}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-white border rounded-lg shadow-sm space-y-3"
    >
      <h2 className="font-semibold text-sm text-gray-700">
        Tambah Judul ke Bookmark
      </h2>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Judul komik"
          className="flex-1 border rounded px-3 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <button
          type="button"
          onClick={searchOnManhwaDesu}
          className="text-xs bg-purple-600 text-white px-3 rounded whitespace-nowrap hover:bg-purple-700"
        >
          🔍 Cari
        </button>
      </div>

      <input
        type="url"
        placeholder="Tempel link halaman komik dari hasil pencarian di atas"
        className="w-full border rounded px-3 py-2 text-sm"
        value={sourceUrl}
        onChange={(e) => setSourceUrl(e.target.value)}
        required
      />
      <input
        type="url"
        placeholder="Link cover/thumbnail (opsional)"
        className="w-full border rounded px-3 py-2 text-sm"
        value={coverUrl}
        onChange={(e) => setCoverUrl(e.target.value)}
      />
      <input
        type="text"
        placeholder="Chapter terakhir dibaca (opsional, misal: Ch. 45)"
        className="w-full border rounded px-3 py-2 text-sm"
        value={lastChapter}
        onChange={(e) => setLastChapter(e.target.value)}
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
      >
        + Simpan Bookmark
      </button>
    </form>
  );
}
