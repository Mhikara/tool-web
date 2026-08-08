"use client";
import { useState } from "react";
import Link from "next/link";
import BookmarkList from "@/components/baca-komik/BookmarkList";
import AddBookmarkForm from "@/components/baca-komik/AddBookmarkForm";

export default function BacaKomikPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">📖 Baca Komik — Tracker</h1>
      <p className="text-sm text-gray-500 mb-6">
        Simpan judul favorit & progres bacamu. Tombol &quot;Baca&quot; akan
        membuka situs sumber resmi di tab baru — konten komik tetap dibaca
        langsung dari sana.
      </p>

      <Link
        href="/tools/baca-komik/search"
        className="inline-block mb-6 text-sm bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
      >
        🔍 Cari Manga/Manhwa Baru
      </Link>

      <AddBookmarkForm onAdded={() => setRefreshKey((k) => k + 1)} />

      <div className="mt-8">
        <BookmarkList refreshKey={refreshKey} />
      </div>
    </div>
  );
}
