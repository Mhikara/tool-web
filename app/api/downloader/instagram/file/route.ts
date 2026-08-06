import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const filename = req.nextUrl.searchParams.get("filename") || "instagram-media";

  if (!url) {
    return NextResponse.json({ error: "URL file wajib" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://www.instagram.com/",
        Origin: "https://www.instagram.com",
        Accept: "*/*",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Gagal ambil file dari Instagram CDN" },
        { status: 502 }
      );
    }

    const contentType =
      res.headers.get("content-type") || "application/octet-stream";
    const buffer = await res.arrayBuffer();
    const safeName = filename.replace(/[^\w.\-]+/g, "_");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("[ig-file]", err);
    return NextResponse.json(
      { error: err?.message || "Gagal unduh" },
      { status: 500 }
    );
  }
}
