import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "Link TikTok wajib diisi" }, { status: 400 });
    }

    const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
    const data = await res.json();

    if (data.code !== 0 || !data.data) {
      return NextResponse.json({ error: "Gagal mengambil data TikTok, cek kembali link-nya" }, { status: 500 });
    }

    return NextResponse.json({
      title: data.data.title,
      cover: data.data.cover,
      videoUrl: data.data.play || null,
      audioUrl: data.data.music || null,
      images: data.data.images || null, // untuk post foto/slideshow
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Terjadi kesalahan saat memproses TikTok" }, { status: 500 });
  }
}
