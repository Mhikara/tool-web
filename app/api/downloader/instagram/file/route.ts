import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const filename =
    req.nextUrl.searchParams.get("filename") || "instagram-media";
  if (!url) {
    return NextResponse.json({ error: "URL wajib" }, { status: 400 });
  }
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://www.instagram.com/",
        Origin: "https://www.instagram.com",
      },
      redirect: "follow",
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Gagal ambil file CDN" }, { status: 502 });
    }
    const buf = await res.arrayBuffer();
    const ct = res.headers.get("content-type") || "application/octet-stream";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": ct,
        "Content-Disposition": `attachment; filename="${filename.replace(/[^\w.\-]+/g, "_")}"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Gagal unduh" },
      { status: 500 }
    );
  }
}
