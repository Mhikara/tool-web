import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Host yang boleh di-proxy (CDN komik) */
const ALLOW = [
  "img.fullmanhwa.com",
  "img01.manhwabuddy.com",
  "img02.manhwabuddy.com",
  "img03.manhwabuddy.com",
  "img04.manhwabuddy.com",
  "img05.manhwabuddy.com",
  "mg.mgread.io",
  "mgread.io",
  // FullManhwa / mangaraw CDN (error 403 sebelumnya)
  "imgsrv4.com",
  "imgsrv3.com",
  "imgsrv2.com",
  "imgsrv1.com",
  "imgsrv.com",
  "fastcdn.com",
  "cdn_mangaraw",
];

function hostAllowed(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (ALLOW.some((a) => h === a || h.endsWith("." + a))) return true;
  // pola imgsrv*.com
  if (/^imgsrv\d*\.com$/.test(h)) return true;
  if (h.includes("manhwabuddy") || h.includes("fullmanhwa") || h.includes("mgread")) return true;
  if (h.includes("mangaraw") || h.includes("fastcdn")) return true;
  return false;
}

function pickReferer(target: URL): string {
  const h = target.hostname.toLowerCase();
  if (h.includes("imgsrv") || h.includes("mangaraw") || h.includes("fastcdn")) {
    return "https://fullmanhwa.com/";
  }
  if (h.includes("mgread")) return "https://mgread.io/";
  return "https://fullmanhwa.com/";
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

    if (!hostAllowed(target.hostname)) {
      return NextResponse.json(
        { error: "host tidak diizinkan: " + target.hostname },
        { status: 403 }
      );
    }

    const referer = pickReferer(target);
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: referer,
      Origin: referer.replace(/\/$/, ""),
    };

    let res = await fetch(target.toString(), {
      headers,
      redirect: "follow",
    });

    // Retry sekali dengan referer alternatif jika 403
    if (res.status === 403) {
      res = await fetch(target.toString(), {
        headers: {
          ...headers,
          Referer: "https://www.google.com/",
          Origin: "https://www.google.com",
        },
        redirect: "follow",
      });
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          error: "upstream " + res.status,
          host: target.hostname,
        },
        {
          status: 502,
          headers: { "Cache-Control": "public, max-age=30" },
        }
      );
    }

    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("content-type") || "image/jpeg",
        "Cache-Control":
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "proxy error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
