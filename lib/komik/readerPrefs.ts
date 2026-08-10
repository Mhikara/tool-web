"use client";

export type ReaderPrefs = {
  fit: "width" | "full";
  gap: number; // px antar gambar
};

const PREF_KEY = "baca_komik_reader_prefs_v1";
const PROGRESS_KEY = "baca_komik_scroll_progress_v1";

export function getReaderPrefs(): ReaderPrefs {
  if (typeof window === "undefined") return { fit: "width", gap: 0 };
  try {
    return {
      fit: "width",
      gap: 0,
      ...JSON.parse(localStorage.getItem(PREF_KEY) || "{}"),
    };
  } catch {
    return { fit: "width", gap: 0 };
  }
}

export function saveReaderPrefs(p: Partial<ReaderPrefs>) {
  const next = { ...getReaderPrefs(), ...p };
  localStorage.setItem(PREF_KEY, JSON.stringify(next));
  return next;
}

/** progress 0..1 per chapterId */
export function saveScrollProgress(chapterId: string, ratio: number) {
  try {
    const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    all[chapterId] = Math.max(0, Math.min(1, ratio));
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  } catch {}
}

export function getScrollProgress(chapterId: string): number {
  try {
    const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    return Number(all[chapterId] || 0);
  } catch {
    return 0;
  }
}
