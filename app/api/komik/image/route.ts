import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const BROWSER_MAX_AGE = 60 * 60 * 24 * 7;
const CDN_MAX_AGE = 60 * 60 * 24 * 30;

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
];

function allowedHost(host: string) {
  const h = host.toLowerCase();
  return ALLOW.some((a) => h === a || h.endsWith("." + a));
}

function cacheHeaders(contentType: string, etag: string) {
  return {
    "Content-Type": contentType,
    ETag: etag,
    "Cache-Control":
      "public, max-age=" +
      BROWSER_MAX_AGE +
      ", s-maxage=" +
      CDN_MAX_AGE +
      ", stale-while-revalidate=86400",
    "CDN-Cache-Control":
      "public, s-maxage=" + CDN_MAX_AGE + ", stale-while-revalidate=86400",
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "cross-origin",
  };
}

function simpleHash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const raw = sp.get("url") || "";
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

    // q=40..90 (default 72), w=max width (default 1080, 0=asli)
    const quality = Math.min(90, Math.max(40, Number(sp.get("q") || 72) || 72));
    const maxW = Math.min(2000, Math.max(0, Number(sp.get("w") || 1080) || 1080));
    const format = (sp.get("f") || "webp").toLowerCase(); // webp | jpeg | avif | origin

    const upstream = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://fullmanhwa.com/",
      },
      next: { revalidate: CDN_MAX_AGE },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "upstream " + upstream.status },
        { status: 502, headers: { "Cache-Control": "public, max-age=60" } }
      );
    }

    const input = Buffer.from(await upstream.arrayBuffer());
    const ifNoneMatch = req.headers.get("if-none-match");

    // Tanpa kompresi
    if (format === "origin") {
      const ctype = upstream.headers.get("content-type") || "image/jpeg";
      const etag =
        upstream.headers.get("etag") ||
        '"' + simpleHash(raw + ":" + input.length) + '"';
      if (ifNoneMatch === etag) {
        return new NextResponse(null, {
          status: 304,
          headers: cacheHeaders(ctype, etag),
        });
      }
      return new NextResponse(input, {
        status: 200,
        headers: {
          ...cacheHeaders(ctype, etag),
          "Content-Length": String(input.length),
          "X-Image-Optimized": "0",
        },
      });
    }

    try {
      const sharp = (await import("sharp")).default;
      let pipeline = sharp(input, { failOn: "none" }).rotate();

      if (maxW > 0) {
        pipeline = pipeline.resize({
          width: maxW,
          withoutEnlargement: true,
          fit: "inside",
        });
      }

      let out: Buffer;
      let ctype: string;

      if (format === "avif") {
        out = await pipeline.avif({ quality, effort: 4 }).toBuffer();
        ctype = "image/avif";
      } else if (format === "jpeg" || format === "jpg") {
        out = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
        ctype = "image/jpeg";
      } else {
        out = await pipeline.webp({ quality, effort: 4 }).toBuffer();
        ctype = "image/webp";
      }

      // Jika hasil lebih besar dari asli, kirim asli (hindari regress)
      if (out.length >= input.length * 0.98) {
        const ctypeOrig = upstream.headers.get("content-type") || "image/jpeg";
        const etag =
          '"' + simpleHash(raw + ":orig:" + input.length) + '"';
        if (ifNoneMatch === etag) {
          return new NextResponse(null, {
            status: 304,
            headers: cacheHeaders(ctypeOrig, etag),
          });
        }
        return new NextResponse(input, {
          status: 200,
          headers: {
            ...cacheHeaders(ctypeOrig, etag),
            "Content-Length": String(input.length),
            "X-Image-Optimized": "skip-larger",
          },
        });
      }

      const etag =
        '"' +
        simpleHash(
          raw + ":" + format + ":" + quality + ":" + maxW + ":" + out.length
        ) +
        '"';
      if (ifNoneMatch === etag) {
        return new NextResponse(null, {
          status: 304,
          headers: cacheHeaders(ctype, etag),
        });
      }

      return new NextResponse(out, {
        status: 200,
        headers: {
          ...cacheHeaders(ctype, etag),
          "Content-Length": String(out.length),
          "X-Image-Optimized": "1",
          "X-Image-Bytes-In": String(input.length),
          "X-Image-Bytes-Out": String(out.length),
        },
      });
    } catch {
      // sharp gagal → fallback asli
      const ctype = upstream.headers.get("content-type") || "image/jpeg";
      const etag = '"' + simpleHash(raw + ":fb:" + input.length) + '"';
      return new NextResponse(input, {
        status: 200,
        headers: {
          ...cacheHeaders(ctype, etag),
          "Content-Length": String(input.length),
          "X-Image-Optimized": "fallback",
        },
      });
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "proxy error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
