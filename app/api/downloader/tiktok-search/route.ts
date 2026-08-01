import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { keyword } = await req.json();
    if (!keyword) {
      return NextResponse.json({ error: "Kata kunci wajib diisi" }, { status: 400 });
    }

    const res = await fetch(
      `https://www.tikwm.com/api/feed/search/?keywords=${encodeURIComponent(keyword)}&count=12&hd=1`
    );
    const data = await res.json();

    if (data.code !== 0 || !data.data?.videos) {
      return NextResponse.json({ error: "Gagal mencari video TikTok" }, { status: 500 });
    }

    const results = data.data.videos.map((v: any) => ({
      title: v.title,
      cover: v.cover,
      author: v.author?.nickname || v.author?.unique_id,
      videoUrl: v.play,
      audioUrl: v.music,
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Terjadi kesalahan saat mencari video TikTok" }, { status: 500 });
  }
}
