import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const PRIMARY = (process.env.MANHWADESU_BASE || "https://manhwadesu.im").replace(
  /\/$/,
  ""
);

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
    .replace(/&gt;/g, ">")
    .replace(/\\u0026/g, "&");
}

/** Ambil teks halaman lewat beberapa jalur (hindari Cloudflare Vercel) */
async function loadPage(targetUrl: string): Promise<string | null> {
  const attempts: { url: string; headers?: Record<string, string> }[] = [
    {
      url: "https://r.jina.ai/" + targetUrl,
      headers: {
        Accept: "text/plain",
        "User-Agent": UA,
        "X-Return-Format": "markdown",
      },
    },
    {
      url: "https://r.jina.ai/http://" + targetUrl.replace(/^https?:\/\//, ""),
      headers: { Accept: "text/plain", "User-Agent": UA },
    },
    {
      url:
        "https://api.allorigins.win/raw?url=" + encodeURIComponent(targetUrl),
      headers: { "User-Agent": UA },
    },
    {
      url: targetUrl,
      headers: {
        "User-Agent": UA,
        Accept: "text/html",
        Referer: PRIMARY + "/",
      },
    },
  ];

  for (const a of attempts) {
    try {
      const res = await fetch(a.url, {
        headers: a.headers,
        redirect: "follow",
      });
      if (!res.ok) continue;
      const text = await res.text();
      if (text.length < 300) continue;
      if (/just a moment|cf-browser-verification|attention required/i.test(text))
        continue;
      return text;
    } catch {
      /* next */
    }
  }
  return null;
}

function slugToTitle(slug: string) {
  return slug
    .replace(/\/$/, "")
    .split("/")
    .pop()!
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseList(text: string, base: string) {
  const items: { title: string; url: string; cover: string | null }[] = [];
  const seen = new Set<string>();

  // Markdown / HTML link ke /komik/slug
  const patterns = [
    /\[([^\]]+)\]\((https?:\/\/[^)]+\/komik\/[^)\s]+)\)/gi,
    /href=["'](https?:\/\/[^"']+\/komik\/[^"'\/]+\/?)["']/gi,
    /(https?:\/\/[^\s"'<>]+\/komik\/[a-z0-9-]+\/?)/gi,
  ];

  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      let title = "";
      let url = "";
      if (m.length >= 3 && m[2]?.includes("/komik/")) {
        title = decodeHtml(m[1].trim());
        url = m[2];
      } else {
        url = m[1];
        title = slugToTitle(url);
      }
      url = absUrl(base, url).replace(/\/$/, "") + "/";
      if (/\/komik\/\?|\/komik\/page|order=/i.test(url)) continue;
      const key = url.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ title: title || slugToTitle(url), url, cover: null });
      if (items.length >= 48) return items;
    }
  }
  return items;
}

function parseChapters(text: string, base: string) {
  const chapters: { title: string; url: string }[] = [];
  const seen = new Set<string>();

  const patterns = [
    /\[([^\]]*(?:ch\.?|chapter|bab)[^\]]*)\]\((https?:\/\/[^)]+)\)/gi,
    /\[([^\]]+)\]\((https?:\/\/[^)]+-chapter-\d+[^)]*)\)/gi,
    /href=["'](https?:\/\/[^"']+-chapter-\d+[^"']*)["'][^>]*>\s*([^<]*)/gi,
    /(https?:\/\/[^\s"'<>]+-chapter-\d+[^\s"'<>]*)/gi,
  ];

  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      let title = "";
      let url = "";
      if (m[2] && m[1] && m[2].startsWith("http")) {
        title = decodeHtml(m[1].trim());
        url = m[2];
      } else if (m[2] && m[1]?.startsWith("http")) {
        url = m[1];
        title = decodeHtml((m[2] || "").trim());
      } else {
        url = m[1];
        title = url.match(/chapter-[\w-]+/i)?.[0]?.replace(/-/g, " ") || "Chapter";
      }
      url = absUrl(base, url);
      if (seen.has(url)) continue;
      seen.add(url);
      chapters.push({ title: title || "Chapter", url });
    }
  }
  return chapters.slice(0, 200);
}

function parsePages(text: string) {
  const pages: string[] = [];
  const seen = new Set<string>();

  const patterns = [
    /!\[([^\]]*)\]\((https?:\/\/[^)]+\.(?:webp|jpg|jpeg|png)[^)]*)\)/gi,
    /(?:src|data-src)=["'](https?:\/\/[^"']+\.(?:webp|jpg|jpeg|png)[^"']*)["']/gi,
    /(https?:\/\/[^\s"'<>]+(?:wp-content|cdn|i\d)[^\s"'<>]*\.(?:webp|jpg|jpeg|png)[^\s"'<>]*)/gi,
  ];

  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const src = decodeHtml(m[2] || m[1]);
      if (!src || !/^https?:\/\//i.test(src)) continue;
      if (/avatar|logo|icon|ads|banner|emoji|favicon|pixel|spinner/i.test(src))
        continue;
      if (seen.has(src)) continue;
      seen.add(src);
      pages.push(src);
    }
  }
  return pages;
}

function parseTitle(text: string) {
  const h1 = text.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (h1) return h1;
  const h1html = text.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim();
  if (h1html) return decodeHtml(h1html);
  const og = text.match(
    /property=["']og:title["'][^>]*content=["']([^"']+)["']/i
  )?.[1];
  if (og) return decodeHtml(og);
  return "Komik";
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const action = sp.get("action") || "home";
    const urlParam = sp.get("url") || "";
    const q = sp.get("q") || "";
    const base = PRIMARY;

    if (action === "home") {
      const text = await loadPage(base + "/komik/?order=update");
      if (!text) {
        // fallback homepage
        const home = await loadPage(base + "/");
        if (!home) {
          return NextResponse.json(
            {
              error:
                "Server masih diblokir sumber. Coba lagi 1–2 menit, atau ganti MANHWADESU_BASE.",
              list: [],
            },
            { status: 200 }
          );
        }
        return NextResponse.json({
          base,
          list: parseList(home, base),
        });
      }
      return NextResponse.json({ base, list: parseList(text, base) });
    }

    if (action === "search") {
      if (!q.trim()) {
        return NextResponse.json({ error: "Query kosong", list: [] }, { status: 400 });
      }
      const text = await loadPage(
        base + "/?s=" + encodeURIComponent(q.trim())
      );
      if (!text) {
        return NextResponse.json({ base, list: [], error: "Search gagal, coba lagi" });
      }
      return NextResponse.json({ base, list: parseList(text, base) });
    }

    if (action === "detail") {
      if (!urlParam) {
        return NextResponse.json({ error: "url wajib" }, { status: 400 });
      }
      const text = await loadPage(urlParam);
      if (!text) {
        return NextResponse.json(
          { error: "Gagal buka detail. Coba judul lain." },
          { status: 502 }
        );
      }
      return NextResponse.json({
        title: parseTitle(text),
        chapters: parseChapters(text, base),
        cover: null,
      });
    }

    if (action === "read") {
      if (!urlParam) {
        return NextResponse.json({ error: "url wajib" }, { status: 400 });
      }
      const text = await loadPage(urlParam);
      if (!text) {
        return NextResponse.json(
          { error: "Gagal buka chapter. Coba lagi." },
          { status: 502 }
        );
      }
      const pages = parsePages(text);
      if (!pages.length) {
        return NextResponse.json(
          {
            error:
              "Gambar belum terbaca (lazy-load). Coba chapter lain atau buka ulang.",
          },
          { status: 404 }
        );
      }
      return NextResponse.json({
        title: parseTitle(text),
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
