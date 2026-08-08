export interface Bookmark {
  id: string;
  title: string;
  sourceUrl: string;
  coverUrl: string | null;
  lastChapter: string | null;
  addedAt: string;
}

const STORAGE_KEY = "baca-komik-bookmarks";

export function getBookmarks(): Bookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addBookmark(bookmark: Bookmark) {
  const current = getBookmarks();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([bookmark, ...current])
  );
}

export function removeBookmark(id: string) {
  const current = getBookmarks().filter((b) => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function updateLastChapter(id: string, chapter: string) {
  const current = getBookmarks().map((b) =>
    b.id === id ? { ...b, lastChapter: chapter } : b
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}
