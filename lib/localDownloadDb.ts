export type DownloadRecord = {
  id: string;
  platform: string; // tiktok | instagram | youtube | ...
  title: string;
  url: string;
  mediaType: "video" | "audio" | "image" | "file";
  quality?: string; // HD | normal
  createdAt: number;
};

const KEY = "toolweb_download_history_v1";
const MAX = 100;

function readAll(): DownloadRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAll(list: DownloadRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

export function listDownloads(): DownloadRecord[] {
  return readAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function addDownload(
  item: Omit<DownloadRecord, "id" | "createdAt">
): DownloadRecord {
  const rec: DownloadRecord = {
    ...item,
    id: "dl_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
    createdAt: Date.now(),
  };
  const all = readAll().filter((x) => !(x.url === rec.url && x.platform === rec.platform));
  all.unshift(rec);
  writeAll(all);
  return rec;
}

export function removeDownload(id: string) {
  writeAll(readAll().filter((x) => x.id !== id));
}

export function clearDownloads() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
