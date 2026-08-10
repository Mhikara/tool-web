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

    const host = target.hostname.toLowerCase();
    const ok = ALLOW.some((h) => host === h || host.endsWith("." + h));
    if (!ok) {
      return NextResponse.json({ error: "host tidak diizinkan" }, { status: 403 });
    }

    const res = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://fullmanhwa.com/",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "upstream " + res.status },
        { status: 502, headers: { "Cache-Control": "public, max-age=60" } }
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
