import { NextRequest } from "next/server";
import { fileCached, jsonError, cacheHeaders } from "@/lib/apiCache";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const filename = req.nextUrl.searchParams.get("filename") || "file";

  if (!url) return jsonError("URL file wajib diisi", 400);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://www.tiktok.com/",
      },
      // File dari CDN sumber: cache 1 jam di Next
      next: { revalidate: 3600 },
    });

    if (!res.ok) return jsonError("Gagal mengambil file dari sumber", 502);

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const buffer = await res.arrayBuffer();

    return fileCached(buffer, contentType, filename, {
      maxAge: 3600,   // 1 jam di CDN
      swr: 86400,     // 24 jam stale-while-revalidate
    });
  } catch (err) {
    console.error("[tiktok-file]", err);
    return jsonError("Gagal memproses file", 500);
  }
}
