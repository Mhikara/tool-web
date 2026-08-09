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

  const persistFav = useCallback((list: BookmarkItem[]) => {
    setBookmarks(list);
    localStorage.setItem(FAV_KEY, JSON.stringify(list));
  }, []);

  const persistHist = useCallback((list: HistoryItem[]) => {
    setReadingHistory(list);
    localStorage.setItem(HIST_KEY, JSON.stringify(list));
  }, []);

  const isBookmarked = useCallback(
    (id: string) => bookmarks.some((b) => b.id === id),
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    (item: Omit<BookmarkItem, "savedAt">) => {
      const exists = bookmarks.some((b) => b.id === item.id);
      const next = exists
        ? bookmarks.filter((b) => b.id !== item.id)
        : [{ ...item, savedAt: Date.now() }, ...bookmarks];
      persistFav(next);
      return !exists;
    },
    [bookmarks, persistFav]
  );

  const removeBookmark = useCallback(
    (id: string) => {
      persistFav(bookmarks.filter((b) => b.id !== id));
    },
    [bookmarks, persistFav]
  );

  const addHistory = useCallback(
    (entry: Omit<HistoryItem, "at">) => {
      const filtered = readingHistory.filter(
        (h) =>
          !(h.comicId === entry.comicId && h.chapterId === entry.chapterId)
      );
      const next = [{ ...entry, at: Date.now() }, ...filtered].slice(0, 100);
      persistHist(next);
    },
    [readingHistory, persistHist]
  );

  const isChapterRead = useCallback(
    (chapterId: string) => readingHistory.some((h) => h.chapterId === chapterId),
    [readingHistory]
  );

  const clearHistory = useCallback(() => {
    persistHist([]);
  }, [persistHist]);

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
