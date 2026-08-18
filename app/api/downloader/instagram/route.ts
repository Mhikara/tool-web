import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Link Instagram tidak boleh kosong." }, { status: 400 });
  }

  const engines = [
    `https://api.agatz.xyz/api/instagram?url=${encodeURIComponent(url)}`,
    `https://api.siputzx.my.id/api/d/ig?url=${encodeURIComponent(url)}`,
    `https://api.vreden.my.id/api/igdownload?url=${encodeURIComponent(url)}`
  ];

  for (const apiUrl of engines) {
    try {
      const res = await fetch(apiUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        signal: AbortSignal.timeout(9000),
      });

      if (!res.ok) continue;
      const json = await res.json();

      let mediaList: { 
        type: "video" | "image"; 
        hdUrl: string; 
        sdUrl: string; 
        thumbnail?: string;
      }[] = [];

      if (Array.isArray(json.data)) {
        json.data.forEach((item: any) => {
          const direct = typeof item === "string" ? item : item.url || item.download_url || item.hd;
          const sdFallback = item.sd || item.low || direct;
          if (direct) {
            mediaList.push({
              type: direct.includes(".mp4") ? "video" : "image",
              hdUrl: direct,
              sdUrl: sdFallback,
              thumbnail: item.thumbnail || undefined
            });
          }
        });
      } else if (json.data && typeof json.data === "object") {
        const hd = json.data.hd || json.data.url || json.data.video || json.data.download;
        const sd = json.data.sd || json.data.low || hd;
        if (hd) {
          mediaList.push({
            type: hd.includes(".mp4") ? "video" : "image",
            hdUrl: hd,
            sdUrl: sd,
            thumbnail: json.data.thumbnail || undefined
          });
        }
      } else if (json.result) {
        if (Array.isArray(json.result)) {
          json.result.forEach((item: any) => {
            const direct = typeof item === "string" ? item : item.url || item.hd;
            const sd = item.sd || direct;
            if (direct) {
              mediaList.push({
                type: direct.includes(".mp4") ? "video" : "image",
                hdUrl: direct,
                sdUrl: sd,
              });
            }
          });
        } else if (typeof json.result === "string" && json.result.startsWith("http")) {
          mediaList.push({
            type: json.result.includes(".mp4") ? "video" : "image",
            hdUrl: json.result,
            sdUrl: json.result,
          });
        }
      }

      if (mediaList.length > 0) {
        return NextResponse.json({
          success: true,
          media: mediaList,
          url: url
        });
      }
    } catch {
      continue;
    }
  }

  return NextResponse.json({
    error: "Gagal mengambil media Instagram. Pastikan akun tidak diprivat dan link valid."
  }, { status: 502 });
}
