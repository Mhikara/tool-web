import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const MD = "https://api.mangadex.org";

function coverUrl(mangaId: string, fileName: string | null | undefined) {
  if (!mangaId || !fileName || fileName === "null" || fileName === "undefined") {
    return null;
  }
  return (
    "https://uploads.mangadex.org/covers/" +
    mangaId +
    "/" +
    fileName +
    ".256.jpg"
  );
}

function titleOf(manga: any) {
  const t = manga?.attributes?.title || {};
  return (
    t.id ||
    t.en ||
    t.ja ||
    t["ja-ro"] ||
    (Object.values(t)[0] as string) ||
    "Tanpa judul"
  );
}

function pickCover(manga: any): string | null {
  const rels = manga?.relationships || [];
  const cover = rels.find((r: any) => r.type === "cover_art");
  const fileName = cover?.attributes?.fileName as string | undefined;
  return coverUrl(manga.id, fileName);
}

function isColored(manga: any): boolean {
  const tags = manga?.attributes?.tags || [];
  for (const tag of tags) {
    const name = (tag?.attributes?.name?.en || "").toLowerCase();
    if (
      name.includes("full color") ||
      name.includes("official color") ||
      name === "colored" ||
      name.includes("webtoon")
    ) {
      return true;
    }
  }
  return false;
}

function mapManga(m: any) {
  const colored = isColored(m);
  const status = m?.attributes?.status || "unknown";
  return {
    id: m.id,
    title: String(titleOf(m)),
    url: m.id,
    cover: pickCover(m),
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

async function fetchMangaList(orderKey: string, orderVal: string, limit: number) {
  const url = new URL(MD + "/manga");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("order[" + orderKey + "]", orderVal);
  url.searchParams.append("availableTranslatedLanguage[]", "id");
  url.searchParams.append("includes[]", "cover_art");
  url.searchParams.append("contentRating[]", "safe");
  url.searchParams.append("contentRating[]", "suggestive");
  url.searchParams.append("contentRating[]", "erotica");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "tool-web-komik/1.0",
    },
    next: { revalidate: 180 },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data || []).map(mapManga);
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const action = sp.get("action") || "home";
    const id = sp.get("id") || "";
    const q = sp.get("q") || "";
    const chapterId = sp.get("chapterId") || "";
    const section = sp.get("section") || "latest";

    // home: 3 bagian sekaligus
    if (action === "home") {
      const [latest, popular, topRated] = await Promise.all([
        fetchMangaList("latestUploadedChapter", "desc", 18),
        fetchMangaList("followedCount", "desc", 18),
        fetchMangaList("rating", "desc", 18),
      ]);
      return NextResponse.json({
        source: "MangaDex",
        latest: latest,
        popular: popular,
        topRated: topRated,
        // kompatibel UI lama
        list: latest,
      });
    }

    // satu section saja
    if (action === "section") {
      let list: any[] = [];
      if (section === "popular") {
        list = await fetchMangaList("followedCount", "desc", 24);
      } else if (section === "rating") {
        list = await fetchMangaList("rating", "desc", 24);
      } else {
        list = await fetchMangaList("latestUploadedChapter", "desc", 24);
      }
      return NextResponse.json({ section: section, list: list });
    }

    if (action === "search") {
      if (!q.trim()) {
        return NextResponse.json({ error: "Query kosong", list: [] }, { status: 400 });
      }
      const url = new URL(MD + "/manga");
      url.searchParams.set("limit", "24");
      url.searchParams.set("title", q.trim());
      url.searchParams.append("availableTranslatedLanguage[]", "id");
      url.searchParams.append("includes[]", "cover_art");
      url.searchParams.append("contentRating[]", "safe");
      url.searchParams.append("contentRating[]", "suggestive");
      url.searchParams.append("contentRating[]", "erotica");

      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "tool-web-komik/1.0",
        },
      });
      const json = await res.json();
      return NextResponse.json({
        source: "MangaDex",
        list: (json.data || []).map(mapManga),
      });
    }

    if (action === "detail") {
      const mangaId = id || sp.get("url") || "";
      if (!mangaId) {
        return NextResponse.json({ error: "id wajib" }, { status: 400 });
      }

      const infoUrl = new URL(MD + "/manga/" + mangaId);
      infoUrl.searchParams.append("includes[]", "cover_art");

      // ambil sampai 500 chapter (paginasi)
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
          headers: {
            Accept: "application/json",
            "User-Agent": "tool-web-komik/1.0",
          },
        });
        if (!feedRes.ok) break;
        const feed = await feedRes.json();
        const batch = feed.data || [];
        allChapters.push(...batch);
        if (batch.length < 100) break;
        offset += 100;
      }

      const infoRes = await fetch(infoUrl.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "tool-web-komik/1.0",
        },
      });
      if (!infoRes.ok) {
        return NextResponse.json({ error: "Judul tidak ditemukan" }, { status: 404 });
      }
      const info = await infoRes.json();
      const mapped = mapManga(info.data);

      const chapters = allChapters.map((c: any, idx: number) => {
        const num = c.attributes?.chapter;
        const chTitle = c.attributes?.title;
        let label = num ? "Ch. " + num : "Chapter " + (idx + 1);
        if (chTitle) label = label + " — " + chTitle;
        return {
          id: c.id,
          title: label,
          url: c.id,
          number: num || String(idx + 1),
          index: idx,
        };
      });

      return NextResponse.json({
        title: mapped.title,
        cover: mapped.cover,
        colored: mapped.colored,
        colorLabel: mapped.colorLabel,
        status: mapped.status,
        statusLabel: mapped.statusLabel,
        chapters: chapters,
        totalChapters: chapters.length,
      });
    }

    if (action === "read") {
      const ch = chapterId || id || sp.get("url") || "";
      if (!ch) {
        return NextResponse.json({ error: "chapterId wajib" }, { status: 400 });
      }
      const res = await fetch(MD + "/at-home/server/" + ch, {
        headers: {
          Accept: "application/json",
          "User-Agent": "tool-web-komik/1.0",
        },
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: "Gagal ambil halaman chapter. Coba chapter lain." },
          { status: 502 }
        );
      }
      const json = await res.json();
      const base = json.baseUrl as string;
      const hash = json.chapter?.hash as string;
      const files: string[] =
        json.chapter?.data || json.chapter?.dataSaver || [];
      if (!base || !hash || !files.length) {
        return NextResponse.json(
          { error: "Halaman chapter kosong / tidak tersedia." },
          { status: 404 }
        );
      }
      const pages = files.map(function (f: string) {
        return base + "/data/" + hash + "/" + f;
      });
      return NextResponse.json({
        title: "Chapter",
        pages: pages,
        pageCount: pages.length,
      });
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
