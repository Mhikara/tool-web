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

function mapManga(m: any) {
  return {
    id: m.id,
    title: String(titleOf(m)),
    url: m.id,
    cover: pickCover(m),
  };
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const action = sp.get("action") || "home";
    const id = sp.get("id") || "";
    const q = sp.get("q") || "";
    const chapterId = sp.get("chapterId") || "";

    if (action === "home") {
      const url = new URL(MD + "/manga");
      url.searchParams.set("limit", "24");
      url.searchParams.set("order[latestUploadedChapter]", "desc");
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
        next: { revalidate: 120 },
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: "Gagal memuat daftar", list: [] },
          { status: 502 }
        );
      }
      const json = await res.json();
      const list = (json.data || []).map(mapManga);
      return NextResponse.json({
        source: "MangaDex",
        list,
      });
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

      const feedUrl = new URL(MD + "/manga/" + mangaId + "/feed");
      feedUrl.searchParams.set("limit", "100");
      feedUrl.searchParams.append("translatedLanguage[]", "id");
      feedUrl.searchParams.set("order[chapter]", "desc");
      feedUrl.searchParams.append("contentRating[]", "safe");
      feedUrl.searchParams.append("contentRating[]", "suggestive");
      feedUrl.searchParams.append("contentRating[]", "erotica");

      const [infoRes, feedRes] = await Promise.all([
        fetch(infoUrl.toString(), {
          headers: {
            Accept: "application/json",
            "User-Agent": "tool-web-komik/1.0",
          },
        }),
        fetch(feedUrl.toString(), {
          headers: {
            Accept: "application/json",
            "User-Agent": "tool-web-komik/1.0",
          },
        }),
      ]);

      if (!infoRes.ok) {
        return NextResponse.json({ error: "Judul tidak ditemukan" }, { status: 404 });
      }
      const info = await infoRes.json();
      const feed = await feedRes.json();
      const chapters = (feed.data || []).map((c: any) => {
        const num = c.attributes?.chapter;
        const chTitle = c.attributes?.title;
        let label = num ? "Ch. " + num : "Chapter";
        if (chTitle) label = label + " — " + chTitle;
        return { id: c.id, title: label, url: c.id };
      });

      return NextResponse.json({
        title: titleOf(info.data),
        cover: pickCover(info.data),
        chapters,
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
      return NextResponse.json({ title: "Chapter", pages: pages });
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
