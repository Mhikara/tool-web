import { NextRequest, NextResponse } from "next/server";

function extractMeta(html: string, properties: string[]): string | null {
  for (const prop of properties) {
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

function getShortcode(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/);
  return match?.[1] || null;
}

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "Link Instagram wajib diisi" }, { status: 400 });
    }

    const shortcode = getShortcode(url);
    let videoUrl: string | null = null;
    let imageUrl: string | null = null;

    // Cara 1: coba halaman embed (biasanya tidak kena login wall)
    if (shortcode) {
      try {
        const embedRes = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
          headers: HEADERS,
        });
        const embedHtml = await embedRes.text();
        const videoTagMatch = embedHtml.match(/<video[^>]*src="([^"]+)"/i);
        if (videoTagMatch?.[1]) videoUrl = videoTagMatch[1].replace(/&amp;/g, "&");
        if (!videoUrl) {
          const jsonMatch = embedHtml.match(/"video_url":"([^"]+)"/);
          if (jsonMatch?.[1]) videoUrl = jsonMatch[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/");
        }
        const imgTagMatch = embedHtml.match(/<img[^>]*class="[^"]*EmbeddedMediaImage[^"]*"[^>]*src="([^"]+)"/i);
        if (imgTagMatch?.[1]) imageUrl = imgTagMatch[1].replace(/&amp;/g, "&");
      } catch {
        // lanjut ke fallback
      }
    }

    // Cara 2 (fallback): scrape halaman biasa
    if (!videoUrl && !imageUrl) {
      const res = await fetch(url, { headers: HEADERS });
      const html = await res.text();
      videoUrl = extractMeta(html, ["og:video", "og:video:secure_url", "og:video:url"]);
      imageUrl = extractMeta(html, ["og:image", "og:image:secure_url"]);
      if (!videoUrl) {
        const jsonMatch = html.match(/"video_url":"([^"]+)"/);
        if (jsonMatch?.[1]) videoUrl = jsonMatch[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/");
      }
    }

    if (!videoUrl && !imageUrl) {
      return NextResponse.json(
        { error: "Media tidak ditemukan. Post mungkin private, carousel, atau butuh login." },
        { status: 404 }
      );
    }

    return NextResponse.json({ videoUrl: videoUrl || null, imageUrl: imageUrl || null });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memproses link Instagram" }, { status: 500 });
  }
}
