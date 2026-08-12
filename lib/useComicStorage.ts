"use client";

import { useCallback, useEffect, useState } from "react";

export type BookmarkItem = {
  id: string;
  title: string;
  cover?: string | null;
  source?: string;
  statusLabel?: string;
  savedAt: number;
};

export type HistoryItem = {
  comicId: string;
  title: string;
  cover?: string | null;
  chapterId: string;
  chapterTitle: string;
  at: number;
};

const FAV_KEY = "baca_komik_bookmarks_v1";
const HIST_KEY = "baca_komik_history_v1";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function useComicStorage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [readingHistory, setReadingHistory] = useState<HistoryItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setBookmarks(readJson<BookmarkItem[]>(FAV_KEY, []));
    setReadingHistory(readJson<HistoryItem[]>(HIST_KEY, []));
    setReady(true);
  }, []);

  const isBookmarked = useCallback(
    (id: string) => bookmarks.some((b) => b.id === id),
    [bookmarks]
  );

  const toggleBookmark = useCallback((item: Omit<BookmarkItem, "savedAt">) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.id === item.id);
      const next = exists
        ? prev.filter((b) => b.id !== item.id)
        : [{ ...item, savedAt: Date.now() }, ...prev];
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Stabil: tidak bergantung readingHistory → tidak loop
  const addHistory = useCallback((entry: Omit<HistoryItem, "at">) => {
    setReadingHistory((prev) => {
      const filtered = prev.filter(
        (h) =>
          !(h.comicId === entry.comicId && h.chapterId === entry.chapterId)
      );
      const next = [{ ...entry, at: Date.now() }, ...filtered].slice(0, 100);
      localStorage.setItem(HIST_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isChapterRead = useCallback(
    (chapterId: string) =>
      readingHistory.some((h) => h.chapterId === chapterId),
    [readingHistory]
  );

  const clearHistory = useCallback(() => {
    setReadingHistory([]);
    localStorage.setItem(HIST_KEY, "[]");
  }, []);

  return {
    ready,
    bookmarks,
    readingHistory,
    isBookmarked,
    toggleBookmark,
    removeBookmark,
    addHistory,
    isChapterRead,
    clearHistory,
  };
}
