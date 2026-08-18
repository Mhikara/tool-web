import { NextResponse } from "next/server";

function cleanInstagramUrl(rawUrl: string): string {
  const match = rawUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
  if (match && match[1]) {
    return `https://www.instagram.com/reel/${match[1]}/`;
  }
  return rawUrl.split("?")[0];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json({ error: "Link Instagram tidak boleh kosong." }, { status: 400 });
  }

  const cleanUrl = cleanInstagramUrl(rawUrl);

  // Mengambil API Key dari Environment Variable (jika ada) atau gunakan Official Gateway
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "e20b33b708msh9446ebdf4b5b75fp185794jsn1bb4c00eecff";

  // DAFTAR OFFICIAL API KEY GATEWAYS
  const apiEngines = [
    // 1. Official RapidAPI Instagram Media Downloader
    async () => {
      const res = await fetch(`https://instagram-downloader-download-instagram-videos-stories.p.rapidapi.com/index?url=${encodeURIComponent(cleanUrl)}`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "instagram-downloader-download-instagram-videos-stories.p.rapidapi.com"
        },
        signal: AbortSignal.timeout(9000),
      });

      if (!res.ok) return null;
      const data = await res.json();

      const mediaUrl = data.media || data.download_url || data.url || data.video_url || data.result?.url;
      if (mediaUrl) {
        return [{
          type: (data.type === "image" || mediaUrl.includes(".jpg") || mediaUrl.includes(".png")) ? ("image" as const) : ("video" as const),
          hdUrl: mediaUrl,
          sdUrl: data.sd_url || mediaUrl,
          thumbnail: data.thumbnail || data.picture_url || undefined,
        }];
      }
      return null;
    },

    // 2. Official RapidAPI Video Extractor v2
    async () => {
      const res = await fetch(`https://instagram-reels-downloader2.p.rapidapi.com/.netlify/functions/api/getLink?url=${encodeURIComponent(cleanUrl)}`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "instagram-reels-downloader2.p.rapidapi.com",
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(9000),
      });

      if (!res.ok) return null;
      const data = await res.json();
      const direct = data.download_url || data.url || data.link;

      if (direct) {
        return [{
          type: "video" as const,
          hdUrl: direct,
          sdUrl: direct,
          thumbnail: data.thumbnail || undefined,
        }];
      }
      return null;
    },

    // 3. FastSaver Official API Hub
    async () => {
      const res = await fetch(`https://auto-download-all-in-one.p.rapidapi.com/fetch?url=${encodeURIComponent(cleanUrl)}`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "auto-download-all-in-one.p.rapidapi.com"
        },
        signal: AbortSignal.timeout(9000),
      });

      if (!res.ok) return null;
      const data = await res.json();

      if (data.ok && data.download_url) {
        return [{
          type: data.type === "image" ? ("image" as const) : ("video" as const),
          hdUrl: data.download_url,
          sdUrl: data.download_url,
          thumbnail: data.thumbnail_url || undefined,
        }];
      }
      return null;
    }
  ];

  // Eksekusi API secara berurutan
  for (const runEngine of apiEngines) {
    try {
      const result = await runEngine();
      if (result && result.length > 0) {
        return NextResponse.json({
          success: true,
          media: result,
          cleanUrl: cleanUrl,
        });
      }
    } catch {
      continue;
    }
  }

  return NextResponse.json({
    error: "Gagal mengambil video. Pastikan akun Instagram publik dan link valid.",
  }, { status: 502 });
}
