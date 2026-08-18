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

  // DAFTAR 5 API AGGREGATOR PALING STABIL (No Limit & Free)
  const apiEngines = [
    // Engine 1: Nstar Instagram Downloader API
    async () => {
      const res = await fetch(`https://api.nstar.yuhu.biz.id/api/downloader/igdl?url=${encodeURIComponent(cleanUrl)}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(9000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        return data.data.map((item: any) => ({
          type: item.url.includes(".mp4") ? "video" as const : "image" as const,
          hdUrl: item.url,
          sdUrl: item.url,
          thumbnail: item.thumbnail
        }));
      }
      return null;
    },

    // Engine 2: Alya API (FastDL Backend)
    async () => {
      const res = await fetch(`https://api.alyachan.dev/api/ig?url=${encodeURIComponent(cleanUrl)}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(9000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.status && data.data && Array.isArray(data.data)) {
        return data.data.map((item: any) => ({
          type: item.url.includes(".mp4") ? "video" as const : "image" as const,
          hdUrl: item.url,
          sdUrl: item.url,
        }));
      }
      return null;
    },

    // Engine 3: Ryzendesu Instagram Scraper
    async () => {
      const res = await fetch(`https://api.ryzendesu.vip/api/downloader/ig?url=${encodeURIComponent(cleanUrl)}`, {
        headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
        signal: AbortSignal.timeout(9000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.url && Array.isArray(data.url)) {
        return data.url.map((url: string) => ({
          type: url.includes(".mp4") ? "video" as const : "image" as const,
          hdUrl: url,
          sdUrl: url,
        }));
      }
      return null;
    },

    // Engine 4: Siputzx API Server
    async () => {
      const res = await fetch(`https://api.siputzx.my.id/api/d/ig?url=${encodeURIComponent(cleanUrl)}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(9000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        return data.data.map((item: any) => ({
          type: item.url.includes(".mp4") ? "video" as const : "image" as const,
          hdUrl: item.url,
          sdUrl: item.url,
        }));
      }
      return null;
    },

    // Engine 5: Vreden Web API
    async () => {
      const res = await fetch(`https://api.vreden.web.id/api/igdownload?url=${encodeURIComponent(cleanUrl)}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(9000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.result && Array.isArray(data.result) && data.result.length > 0) {
        return data.result.map((item: any) => ({
          type: item.url.includes(".mp4") ? "video" as const : "image" as const,
          hdUrl: item.url,
          sdUrl: item.sd || item.url,
          thumbnail: item.thumbnail
        }));
      }
      return null;
    }
  ];

  // Eksekusi API secara berurutan, jika gagal coba yang lain
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
    error: "Gagal memproses media. Server pusat sedang sibuk atau postingan bersifat Private.",
  }, { status: 502 });
}
