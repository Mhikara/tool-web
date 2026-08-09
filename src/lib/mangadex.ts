const BASE_URL = "https://api.mangadex.org";
const COVER_BASE = "https://uploads.mangadex.org/covers";

export interface MangaResult {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  status: string;
  tags: string[];
  originalLanguage: string;
}

export interface ChapterResult {
  id: string;
  chapter: string | null;
  title: string | null;
  language: string;
  publishedAt: string;
}

export interface ChapterInfo {
  id: string;
  mangaId: string;
  chapter: string | null;
  language: string;
}

function mapMangaItem(item: any): MangaResult {
  const coverRel = item.relationships?.find((r: any) => r.type === "cover_art");
  const coverFile = coverRel?.attributes?.fileName;

  return {
    id: item.id,
    title:
      item.attributes.title.en ||
      Object.values(item.attributes.title)[0] ||
      "Tanpa judul",
    description:
      item.attributes.description?.en ||
      Object.values(item.attributes.description || {})[0] ||
      "",
    coverUrl: coverFile ? `${COVER_BASE}/${item.id}/${coverFile}` : null,
    status: item.attributes.status,
    tags: item.attributes.tags.map((t: any) => t.attributes.name.en).filter(Boolean),
    originalLanguage: item.attributes.originalLanguage || "ja",
  };
}

export async function searchManga(query: string): Promise<MangaResult[]> {
  const params = new URLSearchParams({
    title: query,
    limit: "20",
    "includes[]": "cover_art",
  });

  const res = await fetch(`${BASE_URL}/manga?${params.toString()}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error("Gagal mencari manga");
  const json = await res.json();
  return json.data.map(mapMangaItem);
}

export interface CatalogOptions {
  status?: "ongoing" | "completed" | "all";
  sort?: "latest" | "popular" | "rating";
  page?: number;
}

export async function getCatalog(
  opts: CatalogOptions = {}
): Promise<{ results: MangaResult[]; total: number }> {
  const limit = 20;
  const offset = ((opts.page || 1) - 1) * limit;

  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    "includes[]": "cover_art",
    "contentRating[]": "safe",
  });
  params.append("contentRating[]", "suggestive");

  if (opts.status && opts.status !== "all") {
    params.append("status[]", opts.status);
  }

  if (opts.sort === "latest") {
    params.set("order[latestUploadedChapter]", "desc");
  } else if (opts.sort === "rating") {
    params.set("order[rating]", "desc");
  } else {
    params.set("order[followedCount]", "desc");
  }

  const res = await fetch(`${BASE_URL}/manga?${params.toString()}`, {
    next: { revalidate: 1800 },
  });

  if (!res.ok) throw new Error("Gagal mengambil katalog");
  const json = await res.json();

  return { results: json.data.map(mapMangaItem), total: json.total || 0 };
}

export async function getMangaDetail(id: string): Promise<MangaResult | null> {
  const params = new URLSearchParams({ "includes[]": "cover_art" });
  const res = await fetch(`${BASE_URL}/manga/${id}?${params.toString()}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) return null;
  const json = await res.json();
  return mapMangaItem(json.data);
}

async function fetchChaptersByLang(mangaId: string, lang: string): Promise<ChapterResult[]> {
  const params = new URLSearchParams({
    manga: mangaId,
    "translatedLanguage[]": lang,
    "order[chapter]": "asc",
    limit: "100",
  });

  const res = await fetch(`${BASE_URL}/chapter?${params.toString()}`, {
    next: { revalidate: 1800 },
  });

  if (!res.ok) throw new Error("Gagal mengambil daftar chapter");
  const json = await res.json();

  return json.data.map((item: any) => ({
    id: item.id,
    chapter: item.attributes.chapter,
    title: item.attributes.title,
    language: item.attributes.translatedLanguage,
    publishedAt: item.attributes.publishAt,
  }));
}

// Coba bahasa Inggris dulu, kalau kosong fallback ke Indonesia
export async function getChapters(
  mangaId: string,
  preferredLang = "en"
): Promise<{ chapters: ChapterResult[]; language: string }> {
  const primary = await fetchChaptersByLang(mangaId, preferredLang);
  if (primary.length > 0) {
    return { chapters: primary, language: preferredLang };
  }

  const fallbackLang = preferredLang === "en" ? "id" : "en";
  const fallback = await fetchChaptersByLang(mangaId, fallbackLang);
  return { chapters: fallback, language: fallback.length > 0 ? fallbackLang : preferredLang };
}

export async function getChapterPages(chapterId: string): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/at-home/server/${chapterId}`);
  if (!res.ok) throw new Error("Gagal mengambil halaman chapter");
  const json = await res.json();
  const { baseUrl, chapter } = json;
  return chapter.data.map((filename: string) => `${baseUrl}/data/${chapter.hash}/${filename}`);
}

export async function getChapterInfo(chapterId: string): Promise<ChapterInfo | null> {
  const res = await fetch(`${BASE_URL}/chapter/${chapterId}`);
  if (!res.ok) return null;
  const json = await res.json();
  const item = json.data;
  const mangaRel = item.relationships.find((r: any) => r.type === "manga");

  return {
    id: item.id,
    mangaId: mangaRel?.id || "",
    chapter: item.attributes.chapter,
    language: item.attributes.translatedLanguage,
  };
}

export async function getAdjacentChapters(
  chapterId: string
): Promise<{ prevId: string | null; nextId: string | null; mangaId: string | null }> {
  const info = await getChapterInfo(chapterId);
  if (!info || !info.mangaId) return { prevId: null, nextId: null, mangaId: null };

  const { chapters } = await getChapters(info.mangaId, info.language);
  const index = chapters.findIndex((c) => c.id === chapterId);
  if (index === -1) return { prevId: null, nextId: null, mangaId: info.mangaId };

  return {
    prevId: index > 0 ? chapters[index - 1].id : null,
    nextId: index < chapters.length - 1 ? chapters[index + 1].id : null,
    mangaId: info.mangaId,
  };
}
