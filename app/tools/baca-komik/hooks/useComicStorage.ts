"use client";
import { useState, useEffect, useCallback } from "react";

export interface ComicMeta {
  id: string;
  title: string;
  cover: string;
  chapterId?: string;
  chapterTitle?: string;
  timestamp: number;
}

export function useComicStorage() {
  const [history, setHistory] = useState<ComicMeta[]>([]);
  const [bookmarks, setBookmarks] = useState<ComicMeta[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const hist = localStorage.getItem("comic_history");
      const book = localStorage.getItem("comic_bookmarks");
      if (hist) {
        const parsed: ComicMeta[] = JSON.parse(hist);
        // Bersihkan data corrupt lama jika ada item yang judulnya adalah "Chapter X"
        const cleaned = parsed.map(item => {
          if (item.title && (item.title.toLowerCase().startsWith("chapter ") || item.title === "0")) {
            const fallbackTitle = item.id.includes(":") ? item.id.split(":")[1].replace(/-/g, " ") : "Komik Pilihan";
            return { ...item, title: fallbackTitle.toUpperCase() };
          }
          return item;
        });
        setHistory(cleaned);
      }
      if (book) setBookmarks(JSON.parse(book));
    } catch (e) {
      console.error("Gagal parse localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveHistory = useCallback((comic: Omit<ComicMeta, "timestamp">) => {
    setHistory((prev) => {
      const existing = prev.find((p) => p.id === comic.id);
      
      // Proteksi: jangan timpa title asli komik dengan teks chapter
      let safeTitle = comic.title;
      if (!safeTitle || safeTitle.toLowerCase().startsWith("chapter ") || safeTitle === "0") {
        safeTitle = existing?.title || (comic.id.includes(":") ? comic.id.split(":")[1].replace(/-/g, " ") : "Komik");
      }

      // Proteksi: jaga cover jika parameter baru kosong
      const safeCover = comic.cover || existing?.cover || "";

      const newItem: ComicMeta = {
        id: comic.id,
        title: safeTitle,
        cover: safeCover,
        chapterId: comic.chapterId || existing?.chapterId,
        chapterTitle: comic.chapterTitle || existing?.chapterTitle || comic.chapterId,
        timestamp: Date.now()
      };

      const filtered = prev.filter((p) => p.id !== comic.id);
      const next = [newItem, ...filtered].slice(0, 50);
      localStorage.setItem("comic_history", JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleBookmark = useCallback((comic: Omit<ComicMeta, "timestamp">) => {
    setBookmarks((prev) => {
      const exists = prev.find((p) => p.id === comic.id);
      let next;
      if (exists) {
        next = prev.filter((p) => p.id !== comic.id);
      } else {
        next = [{ ...comic, timestamp: Date.now() }, ...prev];
      }
      localStorage.setItem("comic_bookmarks", JSON.stringify(next));
      return next;
    });
  }, []);

  return { history, bookmarks, isLoaded, saveHistory, toggleBookmark };
}
