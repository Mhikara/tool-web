const BASE_URL = "https://api.mangadex.org";
const COVER_BASE = "https://uploads.mangadex.org/covers";

export interface MangaResult {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  status: string;
  tags: string[];
}

export interface ChapterResult {
  id: string;
  chapter: string | null;
  title: string | null;
  language: string;
  publishedAt: string;
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

  return json.data.map((item: any) => {
    const coverRel = item.relationships.find(
      (r: any) => r.type === "cover_art"
    );
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
      tags: item.attributes.tags
        .map((t: any) => t.attributes.name.en)
        .filter(Boolean),
    };
  });
}

export async function getMangaDetail(id: string): Promise<MangaResult | null> {
  const params = new URLSearchParams({ "includes[]": "cover_art" });
  const res = await fetch(`${BASE_URL}/manga/${id}?${params.toString()}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) return null;
  const json = await res.json();
  const item = json.data;
  const coverRel = item.relationships.find((r: any) => r.type === "cover_art");
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
    tags: item.attributes.tags
      .map((t: any) => t.attributes.name.en)
      .filter(Boolean),
  };
}

export async function getChapters(
  mangaId: string,
  lang = "en"
): Promise<ChapterResult[]> {
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

export async function getChapterPages(chapterId: string): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/at-home/server/${chapterId}`);
  if (!res.ok) throw new Error("Gagal mengambil halaman chapter");
  const json = await res.json();

  const { baseUrl, chapter } = json;
  return chapter.data.map(
    (filename: string) => `${baseUrl}/data/${chapter.hash}/${filename}`
  );
}
