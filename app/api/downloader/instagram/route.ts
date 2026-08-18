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

  // DAFTAR ENGINE DOWNLOAR INSTAGRAM AKTIF (SnapSave, Cobalt, & Vreden Scraper)
  const endpoints = [
    // Engine 1: Cobalt Tools Dedicated Instance
    async () => {
      const res = await fetch("https://cobalt-api.kwiatekm.tokyo/", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: cleanUrl }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (json.url) {
        return [{
          type: "video" as const,
          hdUrl: json.url,
          sdUrl: json.url,
        }];
      }
      if (Array.isArray(json.picker)) {
        return json.picker.map((p: any) => ({
          type: p.type === "photo" ? ("image" as const) : ("video" as const),
          hdUrl: p.url,
          sdUrl: p.url,
          thumbnail: p.thumb,
        }));
      }
      return null;
    },

    // Engine 2: FastDL / SnapSave Aggregator API
    async () => {
      const res = await fetch(`https://api.vreden.web.id/api/igdownload?url=${encodeURIComponent(cleanUrl)}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (json.result && Array.isArray(json.result) && json.result.length > 0) {
        return json.result.map((item: any) => {
          const direct = typeof item === "string" ? item : item.url || item.download_url;
          return {
            type: direct.includes(".mp4") ? ("video" as const) : ("image" as const),
            hdUrl: direct,
            sdUrl: item.sd || direct,
            thumbnail: item.thumbnail,
          };
        });
      }
      return null;
    },

    // Engine 3: Siputzx Instagram Scraper
    async () => {
      const res = await fetch(`https://api.siputzx.my.id/api/d/ig?url=${encodeURIComponent(cleanUrl)}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        return json.data.map((item: any) => ({
          type: item.url?.includes(".mp4") ? ("video" as const) : ("image" as const),
          hdUrl: item.url,
          sdUrl: item.url,
          thumbnail: item.thumbnail,
        }));
      }
      return null;
    },

    // Engine 4: Ryzendesu Dedicated Media Extractor
    async () => {
      const res = await fetch(`https://api.ryzendesu.vip/api/downloader/ig?url=${encodeURIComponent(cleanUrl)}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (json.url && Array.isArray(json.url)) {
        return json.url.map((u: string) => ({
          type: u.includes(".mp4") ? ("video" as const) : ("image" as const),
          hdUrl: u,
          sdUrl: u,
        }));
      }
      return null;
    }
  ];

  // Jalankan mesin secara berurutan sampai menemukan hasil
  for (const fetchEngine of endpoints) {
    try {
      const result = await fetchEngine();
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
    error: "Gagal mengambil media Instagram. Pastikan akun tidak diprivat dan link masih aktif.",
  }, { status: 502 });
}
