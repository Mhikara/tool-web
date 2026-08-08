"use client";
import { useEffect, useState } from "react";
import {
  getBookmarks,
  removeBookmark,
  updateLastChapter,
  Bookmark,
} from "@/lib/bookmarkStorage";

export default function BookmarkList({ refreshKey }: { refreshKey: number }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    setBookmarks(getBookmarks());
  }, [refreshKey]);

  function handleRemove(id: string) {
    removeBookmark(id);
    setBookmarks(getBookmarks());
  }

  function startEdit(b: Bookmark) {
    setEditingId(b.id);
    setEditValue(b.lastChapter || "");
  }

  function saveEdit(id: string) {
    updateLastChapter(id, editValue);
    setBookmarks(getBookmarks());
    setEditingId(null);
  }

  if (bookmarks.length === 0) {
    return (
      <p className="text-gray-500 text-sm">
        Belum ada bookmark. Tambahkan judul favoritmu di atas.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {bookmarks.map((b) => (
        <div
          key={b.id}
          className="p-4 bg-white border rounded-lg shadow-sm flex gap-3"
        >
          {b.coverUrl && (
            <img
              src={b.coverUrl}
              alt={b.title}
              className="w-16 h-20 object-cover rounded"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{b.title}</h3>

            {editingId === b.id ? (
              <div className="flex gap-1 mt-1">
                <input
                  className="border rounded px-2 py-1 text-xs flex-1"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Ch. 45"
                />
                <button
                  onClick={() => saveEdit(b.id)}
                  className="text-xs bg-green-600 text-white px-2 rounded"
                >
                  Simpan
                </button>
              </div>
            ) : (
              <button
                onClick={() => startEdit(b)}
                className="text-xs text-gray-500 mt-1 underline"
              >
                {b.lastChapter
                  ? `Terakhir: ${b.lastChapter}`
                  : "Set progres baca"}
              </button>
            )}

            <div className="flex gap-2 mt-2">
              <a
                href={b.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Baca →
              </a>
              <button
                onClick={() => handleRemove(b.id)}
                className="text-xs text-red-500 px-2 py-1"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
