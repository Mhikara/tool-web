import { NextRequest } from "next/server";
import { jsonCached, jsonError } from "@/lib/apiCache";

export const runtime = "nodejs";
export const maxDuration = 30;

async function fetchTikwm(url: string) {
  const endpoints = [
    `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`,
    `https://tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
        // Cache fetch ke upstream 5 menit di Next.js
        next: { revalidate: 300 },
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.code === 0 && data.data) return data.data;
    } catch {
      // coba endpoint berikutnya
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return jsonError("Link TikTok wajib diisi", 400);
    }
    if (
      !url.includes("tiktok.com") &&
      !url.includes("vt.tiktok.com") &&
      !url.includes("vm.tiktok.com")
    ) {
      return jsonError("Link harus dari TikTok", 400);
    }

    const data = await fetchTikwm(url.trim());
    if (!data) {
      return jsonError("Gagal mengambil data TikTok. Cek link-nya atau coba lagi.", 502);
    }

    const videoUrl = data.hdplay || data.play || data.wmplay || null;
    const audioUrl = data.music || data.music_info?.play || null;
    const images: string[] = Array.isArray(data.images) ? data.images : [];

    return jsonCached(
      {
        id: data.id || null,
        title: data.title || data.desc || "Tanpa judul",
        cover: data.cover || data.origin_cover || null,
        videoUrl,
        audioUrl,
        images,
        isSlideshow: images.length > 0 && !videoUrl,
        duration: data.duration || null,
        author: {
          name: data.author?.nickname || data.author?.unique_id || "-",
          username: data.author?.unique_id || null,
          avatar: data.author?.avatar || null,
        },
        stats: {
          plays: data.play_count || 0,
          likes: data.digg_count || 0,
          comments: data.comment_count || 0,
          shares: data.share_count || 0,
        },
        downloadVideo: videoUrl
          ? `/api/downloader/tiktok/file?url=${encodeURIComponent(videoUrl)}&filename=tiktok-video.mp4`
          : null,
        downloadAudio: audioUrl
          ? `/api/downloader/tiktok/file?url=${encodeURIComponent(audioUrl)}&filename=tiktok-audio.mp3`
          : null,
      },
      200,
      // Info video: cache CDN 5 menit, SWR 15 menit
      { maxAge: 300, swr: 900 }
    );
  } catch (err: any) {
    console.error("[tiktok]", err);
    return jsonError(err?.message || "Terjadi kesalahan saat memproses TikTok", 500);
  }
}
