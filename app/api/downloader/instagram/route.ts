import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Link Instagram tidak boleh kosong." }, { status: 400 });
  }

  // Multi-Engine API untuk mengambil Reels, Foto, Carousel, & Video Instagram
  const engines = [
    `https://api.agatz.xyz/api/instagram?url=${encodeURIComponent(url)}`,
    `https://api.siputzx.my.id/api/d/ig?url=${encodeURIComponent(url)}`,
    `https://api.vreden.my.id/api/igdownload?url=${encodeURIComponent(url)}`
  ];

  for (const apiUrl of engines) {
    try {
      const res = await fetch(apiUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(9000),
      });

      if (!res.ok) continue;
      const json = await res.json();

      let mediaList: { url: string; type: "video" | "image"; thumbnail?: string }[] = [];

      // Parsing format data dari berbagai provider
      if (Array.isArray(json.data)) {
        json.data.forEach((item: any) => {
          const directUrl = typeof item === "string" ? item : item.url || item.download_url;
          if (directUrl) {
            mediaList.push({
              url: directUrl,
              type: directUrl.includes(".mp4") ? "video" : "image",
              thumbnail: item.thumbnail || undefined
            });
          }
        });
      } else if (json.data && typeof json.data === "object") {
        const direct = json.data.url || json.data.video || json.data.download;
        if (direct) {
          mediaList.push({
            url: direct,
            type: direct.includes(".mp4") ? "video" : "image",
            thumbnail: json.data.thumbnail || undefined
          });
        }
      } else if (json.result) {
        if (Array.isArray(json.result)) {
          json.result.forEach((item: any) => {
            const direct = typeof item === "string" ? item : item.url;
            if (direct) {
              mediaList.push({
                url: direct,
                type: direct.includes(".mp4") ? "video" : "image",
              });
            }
          });
        } else if (typeof json.result === "string" && json.result.startsWith("http")) {
          mediaList.push({
            url: json.result,
            type: json.result.includes(".mp4") ? "video" : "image",
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
    error: "Gagal mengambil media Instagram. Pastikan akun tidak privat dan link valid."
  }, { status: 502 });
}
