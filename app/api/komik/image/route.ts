import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOW = [
  "img.fullmanhwa.com",
  "img01.manhwabuddy.com",
  "img02.manhwabuddy.com",
  "img03.manhwabuddy.com",
  "img04.manhwabuddy.com",
  "img05.manhwabuddy.com",
  "mg.mgread.io",
  "mgread.io",
];

export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get("url") || "";
    if (!raw) return NextResponse.json({ error: "url wajib" }, { status: 400 });
    const target = new URL(raw);
    const host = target.hostname.toLowerCase();
    if (!ALLOW.some((h) => host === h || host.endsWith("." + h))) {
      return NextResponse.json({ error: "host tidak diizinkan" }, { status: 403 });
    }
    const res = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
        Referer: "https://fullmanhwa.com/",
      },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "upstream " + res.status }, { status: 502 });
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
