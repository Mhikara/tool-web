import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "Link Instagram wajib diisi" }, { status: 400 });
    }
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
    });
    const html = await res.text();
    const videoMatch = html.match(/<meta property="og:video" content="([^"]+)"/);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (!videoMatch && !imageMatch) {
      return NextResponse.json(
        { error: "Media tidak ditemukan. Post mungkin private, carousel, atau butuh login." },
        { status: 404 }
      );
    }
    return NextResponse.json({
      videoUrl: videoMatch?.[1] || null,
      imageUrl: imageMatch?.[1] || null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memproses link Instagram" }, { status: 500 });
  }
}
