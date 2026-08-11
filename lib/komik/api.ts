export type ComicItem = {
  id: string;
  title: string;
  url: string;
  cover: string | null;
  colored?: boolean;
  colorLabel?: string;
  statusLabel?: string;
  source?: string;
  external?: string;
  typeLabel?: string;
};

export type ChapterItem = {
  id: string;
  title: string;
  url: string;
  index?: number;
  paid?: boolean;
};

async function getJson(url: string) {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal memuat data");
  return data;
}

export function normalizeList(raw: any[]): ComicItem[] {
  return (raw || []).map((x) => {
    const source = x.source || "";
    const typeLabel =
      source === "omega" || source === "fullmanhwa"
        ? "MANHWA"
        : source === "mangadex"
          ? "MANGA"
          : "KOMIK";
    return {
      id: String(x.id || x.url),
      title: x.title || "Tanpa judul",
      url: String(x.url || x.id),
      cover: x.cover || null,
      colored: x.colored,
      colorLabel: x.colorLabel,
      statusLabel: x.statusLabel,
      source,
      external: x.external,
      typeLabel,
    };
  });
}

export async function fetchHome(source = "all") {
  return getJson(
    "/api/komik?action=home&source=" + encodeURIComponent(source)
  );
}

export async function searchComics(q: string, source = "all") {
  return getJson(
    "/api/komik?action=search&q=" +
      encodeURIComponent(q) +
      "&source=" +
      encodeURIComponent(source)
  );
}

export async function fetchDetail(id: string) {
  return getJson("/api/komik?action=detail&id=" + encodeURIComponent(id));
}

export async function fetchChapter(chapterId: string) {
  return getJson(
    "/api/komik?action=read&chapterId=" + encodeURIComponent(chapterId)
  );
}
