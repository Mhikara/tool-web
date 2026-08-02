import { NextRequest, NextResponse } from "next/server";

function extractMeta(html: string, properties: string[]): string | null {
  for (const prop of properties) {
    // Cocokkan tanpa peduli urutan atribut property/content
    const patterns = [
      new RegExp(`<meta[^>]*property=["']${prop}["'][^>]*content=["']([^"']+)["']`, "i"),
      new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${prop}["']`, "i"),
    ];
    for (const re of patterns) {
      const match = html.match(re);
      if (match?.[1]) return match[1];
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "Link Instagram wajib diisi" }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)",
      },
    });
    const html = await res.text();

    const videoUrl = extractMeta(html, ["og:video", "og:video:secure_url", "og:video:url"]);
    const imageUrl = extractMeta(html, ["og:image", "og:image:secure_url"]);

    // Fallback: cari video_url dari JSON tersemat di halaman (kalau meta tag tidak ada)
    let jsonVideoUrl: string | null = null;
    if (!videoUrl) {
      const jsonMatch = html.match(/"video_url":"([^"]+)"/);
      if (jsonMatch?.[1]) {
        jsonVideoUrl = jsonMatch[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/");
      }
    }

    const finalVideoUrl = videoUrl || jsonVideoUrl;

    if (!finalVideoUrl && !imageUrl) {
      return NextResponse.json(
        { error: "Media tidak ditemukan. Post mungkin private, carousel, atau butuh login." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      videoUrl: finalVideoUrl || null,
      imageUrl: imageUrl || null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memproses link Instagram" }, { status: 500 });
  }
}
