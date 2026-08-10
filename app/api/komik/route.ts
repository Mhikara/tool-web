import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const MD = "https://api.mangadex.org";
const OMEGA = "https://api.omegascans.org";
const FM = "https://fullmanhwa.com";
const MG = "https://mgread.io";
const UA = "tool-web-komik/1.1";

function mdCover(mangaId: string, fileName: string | null | undefined) {
  if (!mangaId || !fileName) return null;
  return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}.256.jpg`;
}

function mdTitle(manga: Record<string, unknown>) {
  const attributes = manga.attributes as
    | { title?: Record<string, string> }
    | undefined;
  const titleMap = attributes?.title || {};
  return (
    titleMap.id ||
    titleMap.en ||
    titleMap.ja ||
    titleMap["ja-ro"] ||
    Object.values(titleMap)[0] ||
    "Tanpa judul"
  );
}

function mdColored(manga: Record<string, unknown>) {
  const attributes = manga.attributes as
    | {
        tags?: Array<{
          attributes?: { name?: Record<string, string> };
        }>;
      }
    | undefined;
  const tags = attributes?.tags || [];

  for (const tag of tags) {
    const name = (tag.attributes?.name?.en || "").toLowerCase();
    if (
      name.includes("full color") ||
      name.includes("official color") ||
      name.includes("webtoon")
    ) {
      return true;
    }
  }

  return false;
}


function mdGenres(manga: any): string[] {
  const tags = manga?.attributes?.tags || [];
  const out: string[] = [];
  for (const tag of tags) {
    if (tag?.attributes?.group !== "genre") continue;
    const name = tag?.attributes?.name?.en;
    if (name) out.push(name);
  }
  return out;
}

function mdTypeLabel(manga: any): string {
  const lang = (manga?.attributes?.originalLanguage || "").toLowerCase();
  if (lang === "ko") return "MANHWA";
  if (lang === "zh" || lang === "zh-hk") return "MANHUA";
  if (lang === "ja") return "MANGA";
  return "KOMIK";
}


function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return "Baru saja";
  if (s < 3600) return Math.floor(s / 60) + "m lalu";
  if (s < 86400) return Math.floor(s / 3600) + "j lalu";
  if (s < 86400 * 7) return Math.floor(s / 86400) + "h lalu";
  return Math.floor(s / (86400 * 7)) + "mg lalu";
}

function mapMd(manga: {
  id: string;
  attributes?: {
    status?: string;
  };
  relationships?: Array<{
    type?: string;
    attributes?: { fileName?: string };
  }>;
}) {
  const relationships = manga.relationships || [];
  const cover = relationships.find((rel) => rel.type === "cover_art");
  const fileName = cover?.attributes?.fileName;
  const colored = mdColored(manga);
  const status = manga.attributes?.status || "unknown";

  return {
    id: `md:${manga.id}`,
    source: "mangadex",
    title: String(mdTitle(manga)),
    url: manga.id,
    cover: mdCover(manga.id, fileName),
    colored,
    colorLabel: colored ? "Bergambar" : "Tidak bergambar",
    updatedAt: manga?.attributes?.updatedAt || null,
    uploadedLabel: relativeTime(manga?.attributes?.updatedAt),
    genres: mdGenres(manga),
    typeLabel: mdTypeLabel(manga),
    originalLanguage: manga?.attributes?.originalLanguage || "",
    status,
    statusLabel:
      status === "completed"
        ? "Tamat"
        : status === "ongoing"
          ? "Ongoing"
          : status === "hiatus"
            ? "Hiatus"
            : status,
  };
}

async function mdList(orderKey: string, limit: number, genre: string = "", typeFilter: string = "all") {
  const url = new URL(`${MD}/manga`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set(`order[${orderKey}]`, "desc");
  url.searchParams.append("availableTranslatedLanguage[]", "id");
  url.searchParams.append("includes[]", "cover_art");
      if (genre) {
        url.searchParams.append("includedTags[]", genre);
        url.searchParams.set("includedTagsMode", "AND");
      }
      if (typeFilter === "manhwa") {
        url.searchParams.append("originalLanguage[]", "ko");
      } else if (typeFilter === "manhua") {
        url.searchParams.append("originalLanguage[]", "zh");
        url.searchParams.append("originalLanguage[]", "zh-hk");
      } else if (typeFilter === "manga") {
        url.searchParams.append("originalLanguage[]", "ja");
      if (demographic && demographic !== "all") {
        url.searchParams.append("publicationDemographic[]", demographic);
      }

      }

  url.searchParams.append("contentRating[]", "safe");
  url.searchParams.append("contentRating[]", "suggestive");
  url.searchParams.append("contentRating[]", "erotica");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json", "User-Agent": UA },
    next: { revalidate: 180 },
  });
  if (!res.ok) return [];

  const json = (await res.json()) as {
    data?: Array<Parameters<typeof mapMd>[0]>;
  };
  return (json.data || []).map(mapMd);
}

type OmegaSeries = {
  id?: number;
  title?: string;
  series_slug: string;
  thumbnail?: string | null;
  status?: string;
};

function mapOmega(series: OmegaSeries) {
  const status = (series.status || "").toLowerCase();
  return {
    id: `omega:${series.series_slug}`,
    source: "omega",
    title: series.title || "Tanpa judul",
    url: series.series_slug,
    cover: series.thumbnail || null,
    colored: true,
    colorLabel: "Bergambar",
    status,
    statusLabel:
      status === "completed"
        ? "Tamat"
        : status === "ongoing"
          ? "Ongoing"
          : status === "hiatus"
            ? "Hiatus"
            : series.status || status,
    seriesId: series.id,
  };
}

async function omegaList(orderBy: string, perPage: number) {
  const url =
    `${OMEGA}/query?query_string=&series_type=Comic&page=1&perPage=${perPage}` +
    `&order=desc&orderBy=${orderBy}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": UA },
    next: { revalidate: 180 },
  });
  if (!res.ok) return [];

  const json = (await res.json()) as { data?: OmegaSeries[] };
  return (json.data || []).map(mapOmega);
}

async function omegaSearch(q: string) {
  const url =
    `${OMEGA}/query?query_string=${encodeURIComponent(q)}` +
    "&series_type=Comic&page=1&perPage=24&order=desc&orderBy=latest";
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": UA },
  });
  if (!res.ok) return [];

  const json = (await res.json()) as { data?: OmegaSeries[] };
  return (json.data || []).map(mapOmega);
}

async function fmFetch(url: string, cookie?: string) {
  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/json",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: `${FM}/`,
  };
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(url, { headers, redirect: "follow" });
  const setCookie = res.headers.getSetCookie?.() || [];
  let cookieOut = cookie || "";

  if (setCookie.length) {
    cookieOut = setCookie
      .map((value) => value.split(";")[0])
      .concat(cookieOut ? [cookieOut] : [])
      .join("; ");
  } else {
    const singleCookie = res.headers.get("set-cookie");
    if (singleCookie) {
      cookieOut =
        singleCookie.split(",")[0].split(";")[0] +
        (cookieOut ? `; ${cookieOut}` : "");
    }
  }

  const text = await res.text();
  return { ok: res.ok, status: res.status, text, cookie: cookieOut };
}

async function fmList() {
  try {
    const got = await fmFetch(`${FM}/latest`);
    if (!got.ok) return [];

    const items: Array<{
      id: string;
      source: string;
      title: string;
      url: string;
      cover: string | null;
      colored: boolean;
      colorLabel: string;
      status: string;
      statusLabel: string;
      external: string;
    }> = [];
    const seen = new Set<string>();
    const linkRe = /href="(?:https?:\/\/fullmanhwa\.com)?\/manga\/([a-z0-9-]+)"/gi;
    let match: RegExpExecArray | null;

    while ((match = linkRe.exec(got.text)) !== null) {
      const slug = match[1];
      if (seen.has(slug) || slug === "page") continue;
      seen.add(slug);

      items.push({
        id: `fm:${slug}`,
        source: "fullmanhwa",
        title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        url: slug,
        cover: null,
        colored: true,
        colorLabel: "Bergambar",
        status: "ongoing",
        statusLabel: "Ongoing",
        external: `${FM}/manga/${slug}`,
      });

      if (items.length >= 30) break;
    }

    const coverRe =
      /https:\/\/img\.fullmanhwa\.com\/covers\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi;
    const covers = got.text.match(coverRe) || [];
    items.forEach((item, index) => {
      if (covers[index]) item.cover = covers[index];
    });

    return items;
  } catch {
    return [];
  }
}

async function fmDetail(slug: string) {
  const got = await fmFetch(`${FM}/manga/${slug}`);
  if (!got.ok) throw new Error("FullManhwa detail gagal");

  const html = got.text;
  const ogTitle =
    html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
    html.match(/content=["']([^"']+)["'][^>]*property=["']og:title["']/i)?.[1] ||
    slug;
  const title = ogTitle.replace(/\s*Manga\s*-\s*FullManhwa.*/i, "").trim();
  const cover =
    html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
    html.match(/content=["'](https:\/\/img\.fullmanhwa\.com\/[^"']+)["']/i)?.[1] ||
    null;

  const seen = new Set<string>();
  const chapters: Array<{
    id: string;
    title: string;
    url: string;
    number: string;
    index?: number;
  }> = [];
  const re = new RegExp(
    `href=["'](?:https?:\\/\\/fullmanhwa\\.com)?\\/manga\\/${slug.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    )}\\/(chapter-\\d+)["']`,
    "gi"
  );

  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const chapterSlug = match[1];
    if (seen.has(chapterSlug)) continue;
    seen.add(chapterSlug);

    const number = chapterSlug.replace("chapter-", "");
    chapters.push({
      id: `fm:${slug}/${chapterSlug}`,
      title: `Ch. ${number}`,
      url: `fm:${slug}/${chapterSlug}`,
      number,
    });
  }

  chapters.sort((a, b) => Number(a.number) - Number(b.number));
  chapters.forEach((chapter, index) => {
    chapter.index = index;
  });

  return {
    title,
    cover,
    colored: true,
    colorLabel: "Bergambar",
    statusLabel: "Ongoing",
    source: "fullmanhwa",
    external: `${FM}/manga/${slug}`,
    chapters,
    totalChapters: chapters.length,
  };
}

async function fmRead(slug: string, chapterSlug: string) {
  const pageUrl = `${FM}/manga/${slug}/${chapterSlug}`;
  const got = await fmFetch(pageUrl);
  if (!got.ok) throw new Error("Gagal buka chapter FullManhwa");

  const token =
    got.text.match(/data-reader-image-token=["']([^"']+)["']/i)?.[1] ||
    got.text.match(/data-token=["']([0-9a-f]{20,})["']/i)?.[1];
  if (!token) throw new Error("Token gambar FullManhwa tidak ditemukan");

  const apiUrl = `${FM}/api/reader_images.php?token=${encodeURIComponent(token)}&lang=en`;
  const imgRes = await fetch(apiUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      Referer: pageUrl,
      Cookie: got.cookie || "",
    },
  });

  const json = (await imgRes.json()) as {
    ok?: boolean;
    error?: string;
    images?: Array<{ url?: string }>;
  };
  if (!json.ok || !Array.isArray(json.images) || json.images.length === 0) {
    throw new Error(json.error || "Gambar chapter FullManhwa kosong");
  }

  const pages = (json.images.map((item) => item.url).filter(Boolean) as string[]).map(
    (u) =>
      "/api/komik/image?url=" +
      encodeURIComponent(u) +
      "&f=webp&q=72&w=1080"
  );
  return {
    title: "Ch. " + chapterSlug.replace("chapter-", ""),
    pages,
    pageCount: pages.length,
    source: "fullmanhwa",
  };
}


/* ---------- Mgread.io (WordPress REST + scrape chapter) ---------- */
async function mgrList() {
  try {
    const url =
      MG +
      "/wp-json/wp/v2/manga?per_page=24&page=1&orderby=modified&order=desc&_embed=1";
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": UA },
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const arr = (await res.json()) as any[];
    return (arr || []).map(function (m: any) {
      const title =
        (m.title && (m.title.rendered || m.title)) || m.slug || "Tanpa judul";
      const clean = String(title).replace(/<[^>]+>/g, "");
      let cover: string | null = null;
      try {
        cover =
          m._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
          m._embedded?.["wp:featuredmedia"]?.[0]?.media_details?.sizes?.medium
            ?.source_url ||
          null;
      } catch {}
      return {
        id: "mgr:" + m.slug,
        source: "mgread",
        title: clean,
        url: m.slug,
        cover: cover,
        colored: true,
        colorLabel: "Bergambar",
        statusLabel: "Ongoing",
        external: m.link || MG + "/manga/" + m.slug + "/",
        updatedAt: m.modified || m.date || null,
      };
    });
  } catch {
    return [];
  }
}

async function mgrSearch(q: string) {
  try {
    const url =
      MG +
      "/wp-json/wp/v2/manga?per_page=24&search=" +
      encodeURIComponent(q) +
      "&_embed=1";
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": UA },
    });
    if (!res.ok) return [];
    const arr = (await res.json()) as any[];
    return (arr || []).map(function (m: any) {
      const title =
        (m.title && (m.title.rendered || m.title)) || m.slug || "Tanpa judul";
      let cover: string | null = null;
      try {
        cover = m._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null;
      } catch {}
      return {
        id: "mgr:" + m.slug,
        source: "mgread",
        title: String(title).replace(/<[^>]+>/g, ""),
        url: m.slug,
        cover: cover,
        colored: true,
        colorLabel: "Bergambar",
        statusLabel: "Ongoing",
        external: m.link || MG + "/manga/" + m.slug + "/",
      };
    });
  } catch {
    return [];
  }
}

async function mgrDetail(slug: string) {
  const pageUrl = MG + "/manga/" + slug + "/";
  const res = await fetch(pageUrl, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html",
    },
  });
  if (!res.ok) throw new Error("Mgread detail gagal");
  const html = await res.text();

  const title =
    html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
    slug.replace(/-/g, " ");
  const cover =
    html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
    null;

  const seen = new Set<string>();
  const chapters: any[] = [];
  const re = new RegExp(
    "/manga/" +
      slug.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&") +
      "/(chapter-[0-9]+)/?",
    "gi"
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const ch = m[1].toLowerCase();
    if (seen.has(ch)) continue;
    seen.add(ch);
    const num = ch.replace("chapter-", "");
    chapters.push({
      id: "mgr:" + slug + "/" + ch,
      title: "Ch. " + num,
      url: "mgr:" + slug + "/" + ch,
      number: Number(num) || 0,
    });
  }
  chapters.sort(function (a, b) {
    return a.number - b.number;
  });

  return {
    title: title.replace(/\s*[-|].*$/, "").trim(),
    cover: cover,
    colorLabel: "Bergambar",
    statusLabel: "Ongoing",
    source: "mgread",
    external: pageUrl,
    chapters: chapters,
    totalChapters: chapters.length,
  };
}

async function mgrRead(slug: string, chapterSlug: string) {
  const pageUrl = MG + "/manga/" + slug + "/" + chapterSlug + "/";
  const res = await fetch(pageUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html",
      Referer: MG + "/",
    },
  });
  if (!res.ok) throw new Error("Gagal buka chapter Mgread");
  const html = await res.text();
  const found = html.match(/https:\/\/mg\.mgread\.io\/[^"'\\s]+/g) || [];
  const pages: string[] = [];
  const seen = new Set<string>();
  for (const u of found) {
    const clean = u.replace(/[\\)>]+$/, "");
    if (seen.has(clean)) continue;
    seen.add(clean);
    pages.push(
      "/api/komik/image?url=" + encodeURIComponent(clean) + "&f=webp&q=72&w=1080"
    );
  }
  if (!pages.length) throw new Error("Gambar Mgread kosong");
  return {
    title: "Ch. " + chapterSlug.replace("chapter-", ""),
    pages: pages,
    pageCount: pages.length,
    source: "mgread",
  };
}


function parseId(raw: string) {
  if (raw.startsWith("md:")) return { source: "mangadex", key: raw.slice(3) };
  if (raw.startsWith("omega:")) return { source: "omega", key: raw.slice(6) };
  if (raw.startsWith("fm:")) return { source: "fullmanhwa", key: raw.slice(3) };
  if (raw.startsWith("mgr:")) return { source: "mgread", key: raw.slice(4) };
  if (/^[0-9a-f-]{36}$/i.test(raw)) return { source: "mangadex", key: raw };
  return { source: "omega", key: raw };
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const action = sp.get("action") || "home";
    const genre = sp.get("genre") || "";
    const demographic = (sp.get("demographic") || "all").toLowerCase();
    const typeFilter = (sp.get("type") || "all").toLowerCase();
    const id = sp.get("id") || "";
    const q = sp.get("q") || "";
    const chapterId = sp.get("chapterId") || "";
    const source = (sp.get("source") || "all").toLowerCase();

    if (action === "home") {
      const tasks: Promise<unknown[]>[] = [];
      tasks.push(source === "all" || source === "mangadex" ? mdList("latestUploadedChapter", 12, genre, typeFilter) : Promise.resolve([]));
      tasks.push(source === "all" || source === "omega" ? omegaList("latest", 12) : Promise.resolve([]));
      tasks.push(source === "all" || source === "fullmanhwa" ? fmList() : Promise.resolve([]));

      const [md, omega, fm] = await Promise.all(tasks);
      const latest = [...omega, ...fm, ...md].slice(0, 36);

      let popular: unknown[] = [];
      let topRated: unknown[] = [];
      if (source === "all" || source === "mangadex") {
        const [p, r] = await Promise.all([
          mdList("followedCount", 12, genre, typeFilter),
          mdList("rating", 12, genre, typeFilter),
        ]);
        popular = p;
        topRated = r;
      }
      if (source === "all" || source === "omega") {
        const op = await omegaList("total_views", 12);
        popular = [...op, ...popular].slice(0, 24);
      }

      return NextResponse.json({
        sources: ["mangadex", "omega", "fullmanhwa"],
        latest,
        popular,
        topRated,
        list: latest,
      });
    }

    if (action === "search") {
      const list: unknown[] = [];

      if (source === "all" || source === "omega") {
        list.push(...(await omegaSearch(q.trim() || "a")));
      }

      if ((source === "all" || source === "mangadex") && q.trim()) {
        const url = new URL(`${MD}/manga`);
        url.searchParams.set("limit", "18");
        url.searchParams.set("title", q.trim());
        url.searchParams.append("availableTranslatedLanguage[]", "id");
        url.searchParams.append("includes[]", "cover_art");
        url.searchParams.append("contentRating[]", "safe");
        url.searchParams.append("contentRating[]", "suggestive");
        url.searchParams.append("contentRating[]", "erotica");

        const res = await fetch(url.toString(), {
          headers: { Accept: "application/json", "User-Agent": UA },
        });
        if (res.ok) {
          const json = (await res.json()) as {
            data?: Array<Parameters<typeof mapMd>[0]>;
          };
          list.push(...(json.data || []).map(mapMd));
        }
      }

      return NextResponse.json({ list });
    }

    if (action === "detail") {
      const parsed = parseId(id || sp.get("url") || "");

      if (parsed.source === "omega") {
        const seriesRes = await fetch(`${OMEGA}/series/${parsed.key}`, {
          headers: { Accept: "application/json", "User-Agent": UA },
        });
        if (!seriesRes.ok) {
          return NextResponse.json(
            { error: "Series tidak ditemukan" },
            { status: 404 }
          );
        }

        const series = (await seriesRes.json()) as {
          id: number;
          title?: string;
          thumbnail?: string | null;
          status?: string;
        };
        const chRes = await fetch(
          `${OMEGA}/chapter/query?page=1&perPage=100&series_id=${series.id}&order=asc`,
          { headers: { Accept: "application/json", "User-Agent": UA } }
        );
        const chJson = chRes.ok
          ? ((await chRes.json()) as {
              data?: Array<{
                chapter_slug: string;
                chapter_name?: string;
                price?: number;
              }>;
            })
          : { data: [] };

        const chapters = (chJson.data || []).map((chapter, index) => ({
          id: `omega:${parsed.key}/${chapter.chapter_slug}`,
          title: chapter.chapter_name || "Chapter",
          url: `omega:${parsed.key}/${chapter.chapter_slug}`,
          index,
          paid: (chapter.price || 0) > 0,
        }));

        return NextResponse.json({
          title: series.title,
          cover: series.thumbnail,
          colorLabel: "Bergambar",
          statusLabel: series.status || "Ongoing",
          source: "omega",
          chapters,
          totalChapters: chapters.length,
        });
      }

      if (parsed.source === "fullmanhwa") {
        try {
          const detail = await fmDetail(parsed.key);
          return NextResponse.json(detail);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Gagal detail FullManhwa";
          return NextResponse.json({ error: message }, { status: 502 });
        }
      }

      const mangaId = parsed.key;
      const infoUrl = new URL(`${MD}/manga/${mangaId}`);
      infoUrl.searchParams.append("includes[]", "cover_art");

      const allChapters: Array<{
        id: string;
        attributes?: { chapter?: string; title?: string };
      }> = [];
      let offset = 0;

      for (let i = 0; i < 5; i += 1) {
        const feedUrl = new URL(`${MD}/manga/${mangaId}/feed`);
        feedUrl.searchParams.set("limit", "100");
        feedUrl.searchParams.set("offset", String(offset));
        feedUrl.searchParams.append("translatedLanguage[]", "id");
        feedUrl.searchParams.set("order[chapter]", "asc");
        feedUrl.searchParams.append("contentRating[]", "safe");
        feedUrl.searchParams.append("contentRating[]", "suggestive");
        feedUrl.searchParams.append("contentRating[]", "erotica");

        const feedRes = await fetch(feedUrl.toString(), {
          headers: { Accept: "application/json", "User-Agent": UA },
        });
        if (!feedRes.ok) break;

        const feed = (await feedRes.json()) as {
          data?: Array<{
            id: string;
            attributes?: { chapter?: string; title?: string };
          }>;
        };
        const batch = feed.data || [];
        allChapters.push(...batch);
        if (batch.length < 100) break;
        offset += 100;
      }

      const infoRes = await fetch(infoUrl.toString(), {
        headers: { Accept: "application/json", "User-Agent": UA },
      });
      if (!infoRes.ok) {
        return NextResponse.json(
          { error: "Judul tidak ditemukan" },
          { status: 404 }
        );
      }

      const info = (await infoRes.json()) as { data: Parameters<typeof mapMd>[0] };
      const mapped = mapMd(info.data);
      const chapters = allChapters.map((chapter, index) => {
        const number = chapter.attributes?.chapter;
        const chapterTitle = chapter.attributes?.title;
        let label = number ? `Ch. ${number}` : `Chapter ${index + 1}`;
        if (chapterTitle) label = `${label} — ${chapterTitle}`;

        return {
          id: `md:${chapter.id}`,
          title: label,
          url: chapter.id,
          index,
        };
      });

      return NextResponse.json({
        title: mapped.title,
        cover: mapped.cover,
        colored: mapped.colored,
        colorLabel: mapped.colorLabel,
        statusLabel: mapped.statusLabel,
        source: "mangadex",
        chapters,
        totalChapters: chapters.length,
      });
    }

    if (action === "read") {
      const raw = chapterId || id || sp.get("url") || "";

      if (raw.startsWith("fm:")) {
        const body = raw.replace(/^fm:/, "");
        const [slug, chapterSlug = "chapter-1"] = body.split("/");

        try {
          const data = await fmRead(slug, chapterSlug);
          return NextResponse.json(data);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Gagal baca FullManhwa";
          return NextResponse.json({ error: message }, { status: 502 });
        }
      }

      if (raw.startsWith("omega:") || raw.includes("/chapter-")) {
        const body = raw.replace(/^omega:/, "");
        const [slug, chapterSlug = "chapter-1"] = body.split("/");
        const res = await fetch(`${OMEGA}/chapter/${slug}/${chapterSlug}`, {
          headers: { Accept: "application/json", "User-Agent": UA },
        });
        if (!res.ok) {
          return NextResponse.json(
            { error: "Chapter Omega gagal / berbayar" },
            { status: 502 }
          );
        }

        const json = (await res.json()) as {
          chapter?: {
            chapter_name?: string;
            chapter_data?: { images?: string[] };
          };
          chapter_data?: { images?: string[] };
        };
        const images =
          json.chapter?.chapter_data?.images || json.chapter_data?.images || [];
        if (images.length === 0) {
          return NextResponse.json(
            { error: "Tidak ada gambar (mungkin chapter berbayar)" },
            { status: 404 }
          );
        }

        return NextResponse.json({
          title: json.chapter?.chapter_name || "Chapter",
          pages: images,
          pageCount: images.length,
          source: "omega",
        });
      }

      const ch = raw.replace(/^md:/, "");
      const res = await fetch(`${MD}/at-home/server/${ch}`, {
        headers: { Accept: "application/json", "User-Agent": UA },
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: "Gagal ambil halaman chapter" },
          { status: 502 }
        );
      }

      const json = (await res.json()) as {
        baseUrl?: string;
        chapter?: { hash?: string; data?: string[]; dataSaver?: string[] };
      };
      const base = json.baseUrl || "";
      const hash = json.chapter?.hash || "";
      const files = json.chapter?.data || json.chapter?.dataSaver || [];
      if (!base || !hash || files.length === 0) {
        return NextResponse.json({ error: "Halaman kosong" }, { status: 404 });
      }

      const pages = files.map((file) => `${base}/data/${hash}/${file}`);
      return NextResponse.json({
        title: "Chapter",
        pages,
        pageCount: pages.length,
        source: "mangadex",
      });
    }

    if (action === "genres") {
      const res = await fetch(`${MD}/manga/tag`, {
        headers: { Accept: "application/json", "User-Agent": UA },
        next: { revalidate: 86400 },
      });
      if (!res.ok) return NextResponse.json({ genres: [] });

      const json = (await res.json()) as {
        data?: Array<{
          id: string;
          attributes?: {
            group?: string;
            name?: Record<string, string>;
          };
        }>;
      };
      const genres = (json.data || [])
        .filter((tag) => tag.attributes?.group === "genre")
        .map((tag) => ({
          id: tag.id,
          name: tag.attributes?.name?.en || "Genre",
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return NextResponse.json({ genres });
    }

    return NextResponse.json({ error: "action tidak dikenal" }, { status: 400 });
  } catch (error) {
    console.error("[komik]", error);
    const message = error instanceof Error ? error.message : "Gagal";
    return NextResponse.json({ error: message, list: [] }, { status: 500 });
  }
}
