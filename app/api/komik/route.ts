import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const MD = "https://api.mangadex.org";
const OMEGA = "https://api.omegascans.org";
const FM = "https://fullmanhwa.com";
const UA = "tool-web-komik/1.1";

/* ---------- MangaDex helpers ---------- */
function mdCover(mangaId: string, fileName: string | null | undefined) {
  if (!mangaId || !fileName) return null;
  return (
    "https://uploads.mangadex.org/covers/" +
    mangaId +
    "/" +
    fileName +
    ".256.jpg"
  );
}

function mdTitle(manga: any) {
  const t = manga?.attributes?.title || {};
  return (
    t.id || t.en || t.ja || t["ja-ro"] || (Object.values(t)[0] as string) || "Tanpa judul"
  );
}

function mdColored(manga: any) {
  const tags = manga?.attributes?.tags || [];
  for (const tag of tags) {
    const name = (tag?.attributes?.name?.en || "").toLowerCase();
    if (
      name.includes("full color") ||
      name.includes("official color") ||
      name.includes("webtoon")
    )
      return true;
  }
  return false;
}

function mapMd(m: any) {
  const rels = m.relationships || [];
  const cover = rels.find((r: any) => r.type === "cover_art");
  const fileName = cover?.attributes?.fileName;
  const colored = mdColored(m);
  const status = m?.attributes?.status || "unknown";
  return {
    id: "md:" + m.id,
    source: "mangadex",
    title: String(mdTitle(m)),
    url: m.id,
    cover: mdCover(m.id, fileName),
    colored: colored,
    colorLabel: colored ? "Bergambar" : "Tidak bergambar",
    status: status,
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

async function mdList(orderKey: string, limit: number) {
  const url = new URL(MD + "/manga");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("order[" + orderKey + "]", "desc");
  url.searchParams.append("availableTranslatedLanguage[]", "id");
  url.searchParams.append("includes[]", "cover_art");
  url.searchParams.append("contentRating[]", "safe");
  url.searchParams.append("contentRating[]", "suggestive");
  url.searchParams.append("contentRating[]", "erotica");
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json", "User-Agent": UA },
    next: { revalidate: 180 },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data || []).map(mapMd);
}

/* ---------- OmegaScans ---------- */
function mapOmega(s: any) {
  const status = (s.status || "").toLowerCase();
  return {
    id: "omega:" + s.series_slug,
    source: "omega",
    title: s.title || "Tanpa judul",
    url: s.series_slug,
    cover: s.thumbnail || null,
    colored: true,
    colorLabel: "Bergambar",
    status: status,
    statusLabel:
      status === "completed"
        ? "Tamat"
        : status === "ongoing"
          ? "Ongoing"
          : status === "hiatus"
            ? "Hiatus"
            : s.status || status,
    seriesId: s.id,
  };
}

async function omegaList(orderBy: string, perPage: number) {
  const url =
    OMEGA +
    "/query?query_string=&series_type=Comic&page=1&perPage=" +
    perPage +
    "&order=desc&orderBy=" +
    orderBy;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": UA },
    next: { revalidate: 180 },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data || []).map(mapOmega);
}

async function omegaSearch(q: string) {
  const url =
    OMEGA +
    "/query?query_string=" +
    encodeURIComponent(q) +
    "&series_type=Comic&page=1&perPage=24&order=desc&orderBy=latest";
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": UA },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data || []).map(mapOmega);
}

/* ---------- FullManhwa (list scrape) ---------- */

async function fmFetch(url: string, cookie?: string) {
  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/json",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: FM + "/",
  };
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(url, { headers, redirect: "follow" });
  const setCookie = res.headers.getSetCookie?.() || [];
  let cookieOut = cookie || "";
  if (setCookie.length) {
    cookieOut = setCookie
      .map((c: string) => c.split(";")[0])
      .concat(cookieOut ? [cookieOut] : [])
      .join("; ");
  } else {
    const sc = res.headers.get("set-cookie");
    if (sc) cookieOut = sc.split(",")[0].split(";")[0] + (cookieOut ? "; " + cookieOut : "");
  }
  const text = await res.text();
  return { ok: res.ok, status: res.status, text, cookie: cookieOut };
}


async function fmFetch(url: string, cookie?: string) {
  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/json",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: FM + "/",
  };
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(url, { headers, redirect: "follow" });
  const setCookie = res.headers.getSetCookie?.() || [];
  let cookieOut = cookie || "";
  if (setCookie.length) {
    cookieOut = setCookie
      .map((c: string) => c.split(";")[0])
      .concat(cookieOut ? [cookieOut] : [])
      .join("; ");
  } else {
    const sc = res.headers.get("set-cookie");
    if (sc) cookieOut = sc.split(",")[0].split(";")[0] + (cookieOut ? "; " + cookieOut : "");
  }
  const text = await res.text();
  return { ok: res.ok, status: res.status, text, cookie: cookieOut };
}

async function fmList() {
  try {
    const got = await fmFetch(FM + "/latest");
    if (!got.ok) return [];
    const html = got.text;
    const items: any[] = [];
    const seen = new Set<string>();
    const linkRe = /href="(?:https?:\/\/fullmanhwa\.com)?\/manga\/([a-z0-9-]+)"/gi;
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(html)) !== null) {
      const slug = m[1];
      if (seen.has(slug) || slug === "page") continue;
      seen.add(slug);
      const title = slug
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
      items.push({
        id: "fm:" + slug,
        source: "fullmanhwa",
        title: title,
        url: slug,
        cover: null,
        colored: true,
        colorLabel: "Bergambar",
        status: "ongoing",
        statusLabel: "Ongoing",
        external: FM + "/manga/" + slug,
      });
      if (items.length >= 30) break;
    }
    const coverRe =
      /https:\/\/img\.fullmanhwa\.com\/covers\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi;
    const covers = html.match(coverRe) || [];
    items.forEach((it: any, i: number) => {
      if (covers[i]) it.cover = covers[i];
    });
    return items;
  } catch {
    return [];
  }
}

async function fmDetail(slug: string) {
  const got = await fmFetch(FM + "/manga/" + slug);
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
  const chapters: any[] = [];
  const re = new RegExp(
    'href=["\'](?:https?:\\/\\/fullmanhwa\\.com)?\\/manga\\/' +
      slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
      '\\/(chapter-\\d+)["\']',
    "gi"
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const chSlug = m[1];
    if (seen.has(chSlug)) continue;
    seen.add(chSlug);
    const num = chSlug.replace("chapter-", "");
    chapters.push({
      id: "fm:" + slug + "/" + chSlug,
      title: "Ch. " + num,
      url: "fm:" + slug + "/" + chSlug,
      number: num,
    });
  }
  chapters.sort((a, b) => Number(a.number) - Number(b.number));
  chapters.forEach((c, i) => {
    c.index = i;
  });

  return {
    title: title,
    cover: cover,
    colored: true,
    colorLabel: "Bergambar",
    statusLabel: "Ongoing",
    source: "fullmanhwa",
    external: FM + "/manga/" + slug,
    chapters: chapters,
    totalChapters: chapters.length,
  };
}

async function fmRead(slug: string, chSlug: string) {
  const pageUrl = FM + "/manga/" + slug + "/" + chSlug;
  const got = await fmFetch(pageUrl);
  if (!got.ok) throw new Error("Gagal buka chapter FullManhwa");
  const html = got.text;
  const token =
    html.match(/data-reader-image-token=["']([^"']+)["']/i)?.[1] ||
    html.match(/data-token=["']([0-9a-f]{20,})["']/i)?.[1];
  if (!token) throw new Error("Token gambar FullManhwa tidak ditemukan");

  const apiUrl =
    FM +
    "/api/reader_images.php?token=" +
    encodeURIComponent(token) +
    "&lang=en";
  const imgRes = await fetch(apiUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      Referer: pageUrl,
      Cookie: got.cookie || "",
    },
  });
  const json = await imgRes.json();
  if (!json?.ok || !Array.isArray(json.images) || !json.images.length) {
    throw new Error(json?.error || "Gambar chapter FullManhwa kosong");
  }
  const pages = json.images.map((it: any) => it.url).filter(Boolean);
  const num = chSlug.replace("chapter-", "");
  return {
    title: "Ch. " + num,
    pages: pages,
    pageCount: pages.length,
    source: "fullmanhwa",
  };
}

function parseId(raw: string) {
  if (raw.startsWith("md:")) return { source: "mangadex", key: raw.slice(3) };
  if (raw.startsWith("omega:")) return { source: "omega", key: raw.slice(6) };
  if (raw.startsWith("fm:")) return { source: "fullmanhwa", key: raw.slice(3) };
  // fallback mangadex uuid
  if (/^[0-9a-f-]{36}$/i.test(raw)) return { source: "mangadex", key: raw };
  return { source: "omega", key: raw };
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const action = sp.get("action") || "home";
    const id = sp.get("id") || "";
    const q = sp.get("q") || "";
    const chapterId = sp.get("chapterId") || "";
    const source = (sp.get("source") || "all").toLowerCase();

    if (action === "home") {
      const tasks: Promise<any[]>[] = [];
      if (source === "all" || source === "mangadex") {
        tasks.push(mdList("latestUploadedChapter", 12));
      } else tasks.push(Promise.resolve([]));
      if (source === "all" || source === "omega") {
        tasks.push(omegaList("latest", 12));
      } else tasks.push(Promise.resolve([]));
      if (source === "all" || source === "fullmanhwa") {
        tasks.push(fmList());
      } else tasks.push(Promise.resolve([]));

      const [md, omega, fm] = await Promise.all(tasks);
      const latest = [...omega, ...fm, ...md].slice(0, 36);

      let popular: any[] = [];
      let topRated: any[] = [];
      if (source === "all" || source === "mangadex") {
        const [p, r] = await Promise.all([
          mdList("followedCount", 12),
          mdList("rating", 12),
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
        latest: latest,
        popular: popular,
        topRated: topRated,
        list: latest,
      });
    }

    if (action === "search") {
      const lists: any[] = [];
      if (source === "all" || source === "omega") {
        lists.push(...(await omegaSearch(q.trim() || "a")));
      }
      if ((source === "all" || source === "mangadex") && q.trim()) {
        const url = new URL(MD + "/manga");
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
          const json = await res.json();
          lists.push(...(json.data || []).map(mapMd));
        }
      }
      return NextResponse.json({ list: lists });
    }

    if (action === "detail") {
      const parsed = parseId(id || sp.get("url") || "");
      if (parsed.source === "omega") {
        const seriesRes = await fetch(OMEGA + "/series/" + parsed.key, {
          headers: { Accept: "application/json", "User-Agent": UA },
        });
        if (!seriesRes.ok) {
          return NextResponse.json({ error: "Series tidak ditemukan" }, { status: 404 });
        }
        const series = await seriesRes.json();
        const seriesId = series.id;
        const chRes = await fetch(
          OMEGA +
            "/chapter/query?page=1&perPage=100&series_id=" +
            seriesId +
            "&order=asc",
          { headers: { Accept: "application/json", "User-Agent": UA } }
        );
        const chJson = chRes.ok ? await chRes.json() : { data: [] };
        const chapters = (chJson.data || []).map((c: any, idx: number) => ({
          id: "omega:" + parsed.key + "/" + c.chapter_slug,
          title: c.chapter_name || "Chapter",
          url: "omega:" + parsed.key + "/" + c.chapter_slug,
          index: idx,
          paid: c.price > 0,
        }));
        // prefer free chapters first in label
        return NextResponse.json({
          title: series.title,
          cover: series.thumbnail,
          colorLabel: "Bergambar",
          statusLabel: series.status || "Ongoing",
          source: "omega",
          chapters: chapters,
          totalChapters: chapters.length,
        });
      }

      if (parsed.source === "fullmanhwa") {
        try {
          const detail = await fmDetail(parsed.key);
          return NextResponse.json(detail);
        } catch (e: any) {
          return NextResponse.json(
            { error: e?.message || "Gagal detail FullManhwa" },
            { status: 502 }
          );
        }
      }

      // MangaDex
      const mangaId = parsed.key;
      const infoUrl = new URL(MD + "/manga/" + mangaId);
      infoUrl.searchParams.append("includes[]", "cover_art");
      const allChapters: any[] = [];
      let offset = 0;
      for (let i = 0; i < 5; i++) {
        const feedUrl = new URL(MD + "/manga/" + mangaId + "/feed");
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
        const feed = await feedRes.json();
        const batch = feed.data || [];
        allChapters.push(...batch);
        if (batch.length < 100) break;
        offset += 100;
      }
      const infoRes = await fetch(infoUrl.toString(), {
        headers: { Accept: "application/json", "User-Agent": UA },
      });
      if (!infoRes.ok) {
        return NextResponse.json({ error: "Judul tidak ditemukan" }, { status: 404 });
      }
      const info = await infoRes.json();
      const mapped = mapMd(info.data);
      const chapters = allChapters.map((c: any, idx: number) => {
        const num = c.attributes?.chapter;
        const chTitle = c.attributes?.title;
        let label = num ? "Ch. " + num : "Chapter " + (idx + 1);
        if (chTitle) label = label + " — " + chTitle;
        return { id: "md:" + c.id, title: label, url: c.id, index: idx };
      });
      return NextResponse.json({
        title: mapped.title,
        cover: mapped.cover,
        colored: mapped.colored,
        colorLabel: mapped.colorLabel,
        statusLabel: mapped.statusLabel,
        source: "mangadex",
        chapters: chapters,
        totalChapters: chapters.length,
      });
    }

    if (action === "read") {
      const raw = chapterId || id || sp.get("url") || "";
      if (raw.startsWith("fm:")) {
        const body = raw.replace(/^fm:/, "");
        const parts = body.split("/");
        const slug = parts[0];
        const chSlug = parts[1] || "chapter-1";
        try {
          const data = await fmRead(slug, chSlug);
          return NextResponse.json(data);
        } catch (e: any) {
          return NextResponse.json(
            { error: e?.message || "Gagal baca FullManhwa" },
            { status: 502 }
          );
        }
      }
      if (raw.startsWith("omega:") || raw.includes("/chapter-")) {
        // omega:slug/chapter-1
        const body = raw.replace(/^omega:/, "");
        const parts = body.split("/");
        const slug = parts[0];
        const chSlug = parts[1] || "chapter-1";
        const res = await fetch(OMEGA + "/chapter/" + slug + "/" + chSlug, {
          headers: { Accept: "application/json", "User-Agent": UA },
        });
        if (!res.ok) {
          return NextResponse.json(
            { error: "Chapter Omega gagal / berbayar" },
            { status: 502 }
          );
        }
        const json = await res.json();
        const images =
          json.chapter?.chapter_data?.images ||
          json.chapter_data?.images ||
          [];
        if (!images.length) {
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
      const res = await fetch(MD + "/at-home/server/" + ch, {
        headers: { Accept: "application/json", "User-Agent": UA },
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: "Gagal ambil halaman chapter" },
          { status: 502 }
        );
      }
      const json = await res.json();
      const base = json.baseUrl as string;
      const hash = json.chapter?.hash as string;
      const files: string[] =
        json.chapter?.data || json.chapter?.dataSaver || [];
      if (!base || !hash || !files.length) {
        return NextResponse.json({ error: "Halaman kosong" }, { status: 404 });
      }
      const pages = files.map(function (f: string) {
        return base + "/data/" + hash + "/" + f;
      });
      return NextResponse.json({
        title: "Chapter",
        pages: pages,
        pageCount: pages.length,
        source: "mangadex",
      });
    }

    if (action === "genres") {
      const res = await fetch(MD + "/manga/tag", {
        headers: { Accept: "application/json", "User-Agent": UA },
        next: { revalidate: 86400 },
      });
      if (!res.ok) return NextResponse.json({ genres: [] });
      const json = await res.json();
      const genres = (json.data || [])
        .filter((tag: any) => tag?.attributes?.group === "genre")
        .map((tag: any) => ({
          id: tag.id,
          name: tag.attributes?.name?.en || "Genre",
        }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
      return NextResponse.json({ genres: genres });
    }

    return NextResponse.json({ error: "action tidak dikenal" }, { status: 400 });
  } catch (err: any) {
    console.error("[komik]", err);
    return NextResponse.json(
      { error: err?.message || "Gagal", list: [] },
      { status: 500 }
    );
  }
}
