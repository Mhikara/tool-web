"use client";
import { useState, useEffect, useCallback } from "react";

export interface ComicMeta {
  id: string;
  title: string;
  cover: string;
  chapterId?: string;
  timestamp: number;
}

export function useComicStorage() {
  const [history, setHistory] = useState<ComicMeta[]>([]);
  const [bookmarks, setBookmarks] = useState<ComicMeta[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load awal saja (mencegah infinite loop)
  useEffect(() => {
    try {
      const hist = localStorage.getItem("comic_history");
      const book = localStorage.getItem("comic_bookmarks");
      if (hist) setHistory(JSON.parse(hist));
      if (book) setBookmarks(JSON.parse(book));
    } catch (e) {
      console.error("Gagal parse localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // PERBAIKAN: Functional update, tidak perlu masuk array dependency useEffect lain
  const saveHistory = useCallback((comic: Omit<ComicMeta, "timestamp">) => {
    setHistory((prev) => {
      const filtered = prev.filter((p) => p.id !== comic.id);
      const next = [{ ...comic, timestamp: Date.now() }, ...filtered].slice(0, 50); // Max 50
      localStorage.setItem("comic_history", JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleBookmark = useCallback((comic: Omit<ComicMeta, "timestamp">) => {
    setBookmarks((prev) => {
      const exists = prev.find((p) => p.id === comic.id);
      let next;
      if (exists) {
        next = prev.filter((p) => p.id !== comic.id); // Remove
      } else {
        next = [{ ...comic, timestamp: Date.now() }, ...prev]; // Add
      }
      localStorage.setItem("comic_bookmarks", JSON.stringify(next));
      return next;
    });
  }, []);

  return { history, bookmarks, isLoaded, saveHistory, toggleBookmark };
}
