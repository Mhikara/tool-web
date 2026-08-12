import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

function allowed(host: string) {
  const h = host.toLowerCase();
  return (
    h.includes("omegascans") ||
    h.includes("omega") ||
    h.includes("fullmanhwa") ||
    h.includes("manhwabuddy") ||
    h.includes("mgread") ||
    h.includes("komiku") ||
    h.includes("mangadex") ||
    h.includes("mangadex.network") ||
    /^imgsrv\d*\.com$/.test(h) ||
    h.includes("mangaraw") ||
    h.includes("fastcdn")
  );
}

export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get("url") || "";
    if (!raw) return NextResponse.json({ error: "url wajib" }, { status: 400 });
    const target = new URL(raw);
    if (!allowed(target.hostname)) {
      return NextResponse.json({ error: "host diblokir" }, { status: 403 });
    }

    const res = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
        Referer: "https://fullmanhwa.com/",
      },
      // cache fetch di Next (revalidate 1 hari)
      next: { revalidate: 86400 },
    } as RequestInit);

    if (!res.ok) {
      return NextResponse.json({ error: "upstream " + res.status }, { status: 502 });
    }

    const buf = await res.arrayBuffer();
    const ct = res.headers.get("content-type") || "image/jpeg";

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": ct,
        // browser + CDN edge
        "Cache-Control":
          "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400, immutable",
        "CDN-Cache-Control": "public, max-age=604800",
        "Vercel-CDN-Cache-Control": "public, max-age=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "proxy error" }, { status: 500 });
  }
}
