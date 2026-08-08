import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Domain mirror ManhwaDesu (sering ganti) */
const BASES = [
  process.env.MANHWADESU_BASE || "https://manhwadesu.im",
  "https://manhwadesu.store",
  "https://manhwadesu.one",
  "https://manhwadesu.cc",
];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function absUrl(base: string, href: string) {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function decodeHtml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function fetchHtml(pathOrUrl: string): Promise<{ html: string; base: string } | null> {
  const isFull = /^https?:\/\//i.test(pathOrUrl);
  for (const base of BASES) {
    const url = isFull ? pathOrUrl : base.replace(/\/$/, "") + pathOrUrl;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
          Referer: base + "/",
        },
        redirect: "follow",
      });
      if (!res.ok) continue;
      const html = await res.text();
      if (html.length < 500) continue;
      if (/cloudflare|just a moment|cf-browser-verification/i.test(html)) continue;
      return { html, base: new URL(res.url).origin };
    } catch {
      /* next mirror */
    }
  }
  return null;
}

function parseList(html: string, base: string) {
  const items: { title: string; url: string; cover: string | null }[] = [];
  // MangaThemesia: .bsx / .listupd .bs
  const blockRe =
    /<div[^>]*class="[^"]*(?:bsx|bs)[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi;
  let blocks = html.match(blockRe) || [];
  if (blocks.length < 3) {
    // fallback: link ke /komik/
    const linkRe =
      /<a[^>]+href="([^"]*\/komik\/[^"]+)"[^>]*>[\s\S]*?(?:title="([^"]+)"|>([^<]{2,80})</)/gi;
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(html)) !== null) {
      const url = absUrl(base, m[1]);
      const title = decodeHtml((m[2] || m[3] || "").trim());
      if (!title || /chapter|ch\./i.test(title)) continue;
      if (items.some((x) => x.url === url)) continue;
      items.push({ title, url, cover: null });
      if (items.length >= 40) break;
    }
    return items;
  }

  for (const b of blocks.slice(0, 40)) {
    const href = b.match(/href="([^"]+)"/i)?.[1];
    const title =
      b.match(/title="([^"]+)"/i)?.[1] ||
      b.match(/<a[^>]*>\s*([^<]{2,80})\s*<\/a>/i)?.[1];
    const cover =
      b.match(/data-src="([^"]+)"/i)?.[1] ||
      b.match(/data-lazy-src="([^"]+)"/i)?.[1] ||
      b.match(/src="([^"]+)"/i)?.[1] ||
      null;
    if (!href || !title) continue;
    const url = absUrl(base, href);
    if (!/\/komik\//i.test(url) && !/\/manga\//i.test(url)) continue;
    items.push({
      title: decodeHtml(title.trim()),
      url,
      cover: cover ? absUrl(base, cover) : null,
    });
  }
  return items;
}

function parseChapters(html: string, base: string) {
  const chapters: { title: string; url: string }[] = [];
  const re =
    /<li[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>\s*([^<]{1,120})\s*<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const url = absUrl(base, m[1]);
    const title = decodeHtml(m[2].trim());
    if (!/chapter|ch\.|episode|bab/i.test(title) && !/chapter|\/ch-/i.test(url)) {
      continue;
    }
    if (chapters.some((c) => c.url === url)) continue;
    chapters.push({ title, url });
  }
  // urutan terbaru dulu biasanya sudah dari HTML
  return chapters.slice(0, 200);
}

function parsePages(html: string, base: string) {
  const pages: string[] = [];
  // fokus area pembaca, buang iklan
  const area =
    html.match(
      /id=["']readerarea["'][^>]*>([\s\S]*?)(?:<\/div>\s*<div[^>]*class="[^"]*(?:chnav|nav|bottom)|$)/i
    )?.[1] ||
    html.match(
      /class=["'][^"']*reading-content[^"']*["'][^>]*>([\s\S]*?)(?:<\/div>\s*<div|$)/i
    )?.[1] ||
    html;

  const imgRe =
    /<img[^>]+(?:data-src|data-lazy-src|data-original-src|src)=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(area)) !== null) {
    let src = decodeHtml(m[1]);
    if (!src || src.startsWith("data:")) continue;
    if (/avatar|logo|icon|ads|banner|pixel|1x1|spacer/i.test(src)) continue;
    if (!/\.(webp|jpg|jpeg|png|gif)/i.test(src) && !/cdn|wp-content|i\d\./i.test(src))
      continue;
    src = absUrl(base, src);
    if (!pages.includes(src)) pages.push(src);
  }
  return pages;
}

function parseTitle(html: string) {
  return (
    html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim() ||
    html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
    "Komik"
  );
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const action = sp.get("action") || "home";
    const url = sp.get("url") || "";
    const q = sp.get("q") || "";

    if (action === "home") {
      const got = await fetchHtml("/komik/?order=update");
      if (!got) {
        return NextResponse.json(
          {
            error:
              "Tidak bisa mengakses ManhwaDesu (mirror down / Cloudflare). Coba lagi nanti atau set MANHWADESU_BASE di Vercel.",
          },
          { status: 502 }
        );
      }
      const list = parseList(got.html, got.base);
      return NextResponse.json({ base: got.base, list });
    }

    if (action === "search") {
      if (!q.trim()) {
        return NextResponse.json({ error: "Query kosong" }, { status: 400 });
      }
      const got = await fetchHtml(
        "/?s=" + encodeURIComponent(q.trim())
      );
      if (!got) {
        return NextResponse.json({ error: "Gagal search" }, { status: 502 });
      }
      return NextResponse.json({
        base: got.base,
        list: parseList(got.html, got.base),
      });
    }

    if (action === "detail") {
      if (!url) {
        return NextResponse.json({ error: "url wajib" }, { status: 400 });
      }
      const got = await fetchHtml(url);
      if (!got) {
        return NextResponse.json({ error: "Gagal buka detail" }, { status: 502 });
      }
      return NextResponse.json({
        title: parseTitle(got.html),
        chapters: parseChapters(got.html, got.base),
        cover:
          extractOgImage(got.html, got.base) ||
          null,
      });
    }

    if (action === "read") {
      if (!url) {
        return NextResponse.json({ error: "url wajib" }, { status: 400 });
      }
      const got = await fetchHtml(url);
      if (!got) {
        return NextResponse.json({ error: "Gagal buka chapter" }, { status: 502 });
      }
      const pages = parsePages(got.html, got.base);
      if (!pages.length) {
        return NextResponse.json(
          {
            error:
              "Halaman chapter tidak ditemukan (mungkin dilindungi atau struktur berubah).",
          },
          { status: 404 }
        );
      }
      return NextResponse.json({
        title: parseTitle(got.html),
        pages,
      });
    }

    return NextResponse.json({ error: "action tidak dikenal" }, { status: 400 });
  } catch (err: any) {
    console.error("[komik]", err);
    return NextResponse.json(
      { error: err?.message || "Gagal" },
      { status: 500 }
    );
  }
}

function extractOgImage(html: string, base: string) {
  const m = html.match(
    /property=["']og:image["'][^>]*content=["']([^"']+)["']/i
  );
  return m?.[1] ? absUrl(base, m[1]) : null;
}
