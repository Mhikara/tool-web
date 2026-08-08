import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const MD = "https://api.mangadex.org";

function coverUrl(mangaId: string, fileName: string | null) {
  if (!fileName) return null;
  return `https://uploads.mangadex.org/covers/\( {mangaId}/ \){fileName}.256.jpg`;
}

function titleOf(manga: any) {
  const t = manga?.attributes?.title || {};
  return (
    t.id ||
    t.en ||
    t.ja ||
    Object.values(t)[0] ||
    "Tanpa judul"
  );
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const action = sp.get("action") || "home";
    const id = sp.get("id") || "";
    const q = sp.get("q") || "";
    const chapterId = sp.get("chapterId") || "";

    if (action === "home") {
      const url =
        MD +
        "/manga?limit=24&order[latestUploadedChapter]=desc&availableTranslatedLanguage[]=id&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica";
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 300 },
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: "Gagal memuat daftar MangaDex", list: [] },
          { status: 502 }
        );
      }
      const json = await res.json();
      const list = (json.data || []).map((m: any) => {
        const rel = (m.relationships || []).find(
          (r: any) => r.type === "cover_art"
        );
        const file = rel?.attributes?.fileName || null;
        return {
          id: m.id,
          title: titleOf(m),
          url: m.id,
          cover: coverUrl(m.id, file),
        };
      });
      return NextResponse.json({
        source: "MangaDex",
        note: "ManhwaDesu diblokir Cloudflare dari Vercel. Pakai MangaDex (ID).",
        list,
      });
    }

    if (action === "search") {
      if (!q.trim()) {
        return NextResponse.json({ error: "Query kosong", list: [] }, { status: 400 });
      }
      const url =
        MD +
        "/manga?limit=24&title=" +
        encodeURIComponent(q.trim()) +
        "&availableTranslatedLanguage[]=id&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica";
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const json = await res.json();
      const list = (json.data || []).map((m: any) => {
        const rel = (m.relationships || []).find(
          (r: any) => r.type === "cover_art"
        );
        return {
          id: m.id,
          title: titleOf(m),
          url: m.id,
          cover: coverUrl(m.id, rel?.attributes?.fileName || null),
        };
      });
      return NextResponse.json({ source: "MangaDex", list });
    }

    if (action === "detail") {
      const mangaId = id || sp.get("url") || "";
      if (!mangaId) {
        return NextResponse.json({ error: "id wajib" }, { status: 400 });
      }
      const [infoRes, feedRes] = await Promise.all([
        fetch(MD + "/manga/" + mangaId + "?includes[]=cover_art", {
          headers: { Accept: "application/json" },
        }),
        fetch(
          MD +
            "/manga/" +
            mangaId +
            "/feed?limit=100&translatedLanguage[]=id&order[chapter]=desc&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica",
          { headers: { Accept: "application/json" } }
        ),
      ]);
      if (!infoRes.ok) {
        return NextResponse.json({ error: "Judul tidak ditemukan" }, { status: 404 });
      }
      const info = await infoRes.json();
      const feed = await feedRes.json();
      const chapters = (feed.data || []).map((c: any) => ({
        id: c.id,
        title:
          (c.attributes.chapter
            ? "Ch. " + c.attributes.chapter
            : "Chapter") +
          (c.attributes.title ? " — " + c.attributes.title : ""),
        url: c.id,
      }));
      return NextResponse.json({
        title: titleOf(info.data),
        chapters,
      });
    }

    if (action === "read") {
      const ch = chapterId || id || sp.get("url") || "";
      if (!ch) {
        return NextResponse.json({ error: "chapterId wajib" }, { status: 400 });
      }
      const res = await fetch(MD + "/at-home/server/" + ch, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: "Gagal ambil halaman chapter" },
          { status: 502 }
        );
      }
      const json = await res.json();
      const base = json.baseUrl;
      const hash = json.chapter?.hash;
      const files: string[] = json.chapter?.data || json.chapter?.dataSaver || [];
      const pages = files.map(
        (f: string) => base + "/data/" + hash + "/" + f
      );
      return NextResponse.json({
        title: "Chapter",
        pages,
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
