import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { keyword } = await req.json();
    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json(
        { error: "Kata kunci wajib diisi" },
        { status: 400 }
      );
    }

    const endpoints = [
      `https://www.tikwm.com/api/feed/search/?keywords=${encodeURIComponent(keyword)}&count=15&hd=1`,
      `https://tikwm.com/api/feed/search/?keywords=${encodeURIComponent(keyword)}&count=15&hd=1`,
    ];

    let videos: any[] = [];

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "application/json",
          },
        });
        if (!res.ok) continue;
        const data = await res.json();
        if (data.code === 0 && data.data?.videos?.length) {
          videos = data.data.videos;
          break;
        }
      } catch {
        // coba berikutnya
      }
    }

    if (!videos.length) {
      return NextResponse.json(
        { error: "Tidak ada hasil atau API sedang sibuk. Coba kata kunci lain." },
        { status: 404 }
      );
    }

    const results = videos.map((v: any) => ({
      id: v.video_id || v.id,
      title: v.title || v.desc || "Tanpa judul",
      cover: v.cover || v.origin_cover,
      author: v.author?.nickname || v.author?.unique_id || "-",
      videoUrl: v.hdplay || v.play || null,
      audioUrl: v.music || null,
      duration: v.duration || null,
      plays: v.play_count || 0,
      likes: v.digg_count || 0,
    }));

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("[tiktok-search]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mencari video TikTok" },
      { status: 500 }
    );
  }
}
