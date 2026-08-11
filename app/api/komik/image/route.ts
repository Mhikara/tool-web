import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

function hostAllowed(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (
    h === "img.fullmanhwa.com" ||
    h.endsWith(".fullmanhwa.com") ||
    h.includes("manhwabuddy") ||
    h.includes("mgread") ||
    /^imgsrv\d*\.com$/.test(h) ||
    h.includes("mangaraw") ||
    h.includes("fastcdn")
  ) {
    return true;
  }
  if (h.includes("komiku")) return true;
  return false;
}

export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get("url") || "";
    if (!raw) return NextResponse.json({ error: "url wajib" }, { status: 400 });
    const target = new URL(raw);
    if (!hostAllowed(target.hostname)) {
      return NextResponse.json(
        { error: "host tidak diizinkan: " + target.hostname },
        { status: 403 }
      );
    }
    const referer = "https://fullmanhwa.com/";
    let res = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
        Referer: referer,
        Origin: "https://fullmanhwa.com",
      },
      redirect: "follow",
    });
    if (res.status === 403) {
      res = await fetch(target.toString(), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "image/*",
          Referer: "https://www.google.com/",
        },
      });
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: "upstream " + res.status, host: target.hostname },
        { status: 502 }
      );
    }
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "proxy error" }, { status: 500 });
  }
}
