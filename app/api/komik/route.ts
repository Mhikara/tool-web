import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const BASES = [
  process.env.MANHWADESU_BASE || "https://manhwadesu.im",
  "https://manhwadesu.com",
  "https://manhwadesu.art",
  "https://manhwadesu.tech",
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

async function fetchDirect(url: string, base: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
      Referer: base + "/",
    },
    redirect: "follow",
  });
  if (!res.ok) return null;
  const html = await res.text();
  if (html.length < 400) return null;
  if (/just a moment|cf-browser-verification|attention required/i.test(html)) {
    return null;
  }
  return { html, base: new URL(res.url).origin };
}

/** Bypass Cloudflare lewat Jina reader */
async function fetchViaJina(url: string, base: string) {
  const jinaUrl = "https://r.jina.ai/http://" + url.replace(/^https?:\/\//, "");
  const res = await fetch(jinaUrl, {
    headers: {
      Accept: "text/html",
      "User-Agent": UA,
      "X-Return-Format": "html",
    },
  });
  if (!res.ok) return null;
  const html = await res.text();
  if (html.length < 400) return null;
  return { html, base };
}

async function fetchHtml(
  pathOrUrl: string
): Promise<{ html: string; base: string } | null> {
  const isFull = /^https?:\/\//i.test(pathOrUrl);

  for (const base of BASES) {
    const url = isFull ? pathOrUrl : base.replace(/\/$/, "") + pathOrUrl;
    try {
      const direct = await fetchDirect(url, base);
      if (direct) return direct;
    } catch {
      /* next */
    }
  }

  // Fallback Jina untuk tiap mirror
  for (const base of BASES) {
    const url = isFull ? pathOrUrl : base.replace(/\/$/, "") + pathOrUrl;
    try {
      const via = await fetchViaJina(url, base);
      if (via) return via;
    } catch {
      /* next */
    }
  }

  return null;
}

function parseList(html: string, base: string) {
  const items: { title: string; url: string; cover: string | null }[] = [];

  // Link /komik/slug
  const linkRe = new RegExp(
    'href=["\'](https?:\\/\\/[^"\']+\\/komik\\/[^"\'\\/]+\\/?|\\/komik\\/[^"\'\\/]+\\/?)["\'][^>]*(?:title=["\']([^"\']+)["\'])?',
    "gi"
  );
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html)) !== null) {
    const url = absUrl(base, m[1]);
    if (/\/komik\/\?|\/komik\/page/i.test(url)) continue;
    let title = decodeHtml((m[2] || "").trim());
    if (!title) {
      const slug = url.split("/komik/")[1]?.replace(/\/$/, "") || "";
      title = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
    if (!title || /chapter|ch\./i.test(title)) continue;
    if (items.some((x) => x.url === url)) continue;
    items.push({ title, url, cover: null });
    if (items.length >= 40) break;
  }

  // Cover dari markdown-style jina atau img dekat
  const imgRe = new RegExp(
    '(https?:\\/\\/[^\\s"\']+(?:jpg|jpeg|png|webp)[^\\s"\']*)',
    "gi"
  );
  // biarkan cover null dulu jika tidak yakin

  return items;
}

function parseChapters(html: string, base: string) {
  const chapters: { title: string; url: string }[] = [];
  const re = new RegExp(
    'href=["\']([^"\']+(?:chapter|ch-)[^"\']*)["\'][^>]*>\\s*([^<]{1,120})',
    "gi"
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const url = absUrl(base, m[1]);
    const title = decodeHtml(m[2].trim());
    if (!title) continue;
    if (chapters.some((c) => c.url === url)) continue;
    chapters.push({ title, url });
  }
  // pola chapter di path
  if (chapters.length < 2) {
    const re2 = new RegExp(
      'href=["\'](https?:\\/\\/[^"\']+-chapter-\\d+[^"\']*|\\/[^"\']+-chapter-\\d+[^"\']*)["\']',
      "gi"
    );
    while ((m = re2.exec(html)) !== null) {
      const url = absUrl(base, m[1]);
      const title =
        url.match(/chapter-[\w-]+/i)?.[0]?.replace(/-/g, " ") || "Chapter";
      if (chapters.some((c) => c.url === url)) continue;
      chapters.push({ title, url });
    }
  }
  return chapters.slice(0, 200);
}

function parsePages(html: string, base: string) {
  const pages: string[] = [];
  const imgRe = new RegExp(
    '(?:src|data-src|data-lazy-src)=["\'](https?:\\/\\/[^"\']+\\.(?:webp|jpg|jpeg|png)[^"\']*)["\']',
    "gi"
  );
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(html)) !== null) {
    let src = decodeHtml(m[1]);
    if (/avatar|logo|icon|ads|banner|pixel|emoji|favicon/i.test(src)) continue;
    src = absUrl(base, src);
    if (!pages.includes(src)) pages.push(src);
  }
  // jina kadang keluarkan URL mentah di baris
  if (pages.length < 2) {
    const re2 =
      /https?:\/\/[^\s"'<>]+(?:wp-content|cdn)[^\s"'<>]+\.(?:webp|jpg|jpeg|png)/gi;
    while ((m = re2.exec(html)) !== null) {
      const src = m[0];
      if (/avatar|logo|icon|ads/i.test(src)) continue;
      if (!pages.includes(src)) pages.push(src);
    }
  }
  return pages;
}

function parseTitle(html: string) {
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim();
  if (h1) return decodeHtml(h1);
  const og = html.match(
    /property=["']og:title["'][^>]*content=["']([^"']+)["']/i
  )?.[1];
  if (og) return decodeHtml(og);
  const md = html.match(/^#\s+(.+)$/m)?.[1];
  if (md) return md.trim();
  return "Komik";
}

function extractOgImage(html: string, base: string) {
  const m = html.match(
    /property=["']og:image["'][^>]*content=["']([^"']+)["']/i
  );
  return m?.[1] ? absUrl(base, m[1]) : null;
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
              "Tidak bisa mengakses ManhwaDesu dari server (Cloudflare). Coba domain lain di MANHWADESU_BASE.",
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
      const got = await fetchHtml("/?s=" + encodeURIComponent(q.trim()));
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
        cover: extractOgImage(got.html, got.base),
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
          { error: "Gambar chapter tidak ditemukan." },
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
