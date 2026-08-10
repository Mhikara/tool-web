import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Cache lama di edge/browser (gambar chapter jarang berubah) */
const BROWSER_MAX_AGE = 60 * 60 * 24 * 7; // 7 hari
const CDN_MAX_AGE = 60 * 60 * 24 * 30; // 30 hari di CDN Vercel

const ALLOW = [
  "img.fullmanhwa.com",
  "img01.manhwabuddy.com",
  "img02.manhwabuddy.com",
  "img03.manhwabuddy.com",
  "img04.manhwabuddy.com",
  "img05.manhwabuddy.com",
  "media.omegascans.org",
  "uploads.mangadex.org",
  "cmdxd98sb0x04.cdn.mangadex.org",
  "uploads.mangadex.org",
];

function allowedHost(host: string) {
  const h = host.toLowerCase();
  return ALLOW.some((a) => h === a || h.endsWith("." + a));
}

export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get("url") || "";
    if (!raw) {
      return NextResponse.json({ error: "url wajib" }, { status: 400 });
    }

    let target: URL;
    try {
      target = new URL(raw);
    } catch {
      return NextResponse.json({ error: "url invalid" }, { status: 400 });
    }

    if (target.protocol !== "http:" && target.protocol !== "https:") {
      return NextResponse.json({ error: "protocol invalid" }, { status: 400 });
    }
    if (!allowedHost(target.hostname)) {
      return NextResponse.json({ error: "host tidak diizinkan" }, { status: 403 });
    }

    // Conditional request dari browser
    const ifNoneMatch = req.headers.get("if-none-match");

    const upstream = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://fullmanhwa.com/",
        ...(ifNoneMatch ? { "If-None-Match": ifNoneMatch } : {}),
      },
      // Cache fetch di Next/Vercel Data Cache
      next: { revalidate: CDN_MAX_AGE },
    });

    if (upstream.status === 304 && ifNoneMatch) {
      return new NextResponse(null, {
        status: 304,
        headers: cacheHeaders(ifNoneMatch, null),
      });
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "upstream " + upstream.status },
        {
          status: 502,
          headers: {
            "Cache-Control": "public, max-age=60",
          },
        }
      );
    }

    const buf = await upstream.arrayBuffer();
    const contentType =
      upstream.headers.get("content-type") || "image/jpeg";
    const etag =
      upstream.headers.get("etag") ||
      '"' +
        simpleHash(target.pathname + ":" + buf.byteLength) +
        '"';

    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: cacheHeaders(etag, contentType),
      });
    }

    return new NextResponse(buf, {
      status: 200,
      headers: {
        ...cacheHeaders(etag, contentType),
        "Content-Length": String(buf.byteLength),
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "proxy error" },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}

function cacheHeaders(etag: string, contentType: string | null) {
  const h: Record<string, string> = {
    // Browser: 7 hari; CDN Vercel: 30 hari; stale-while-revalidate biar tetap cepat
    "Cache-Control":
      "public, max-age=" +
      BROWSER_MAX_AGE +
      ", s-maxage=" +
      CDN_MAX_AGE +
      ", stale-while-revalidate=86400",
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
    // Izinkan ditampilkan di <img> dari domain sendiri
    "Cross-Origin-Resource-Policy": "cross-origin",
  };
  if (contentType) h["Content-Type"] = contentType;
  // Vercel CDN cache key stabil per URL
  h["CDN-Cache-Control"] =
    "public, s-maxage=" + CDN_MAX_AGE + ", stale-while-revalidate=86400";
  return h;
}

function simpleHash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16);
}
