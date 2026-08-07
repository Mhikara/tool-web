import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function cleanUrl(raw: string) {
  let u = raw.trim();
  try {
    const p = new URL(u);
    p.search = "";
    p.hash = "";
    u = p.toString();
  } catch {
    u = u.split("?")[0].split("#")[0];
  }
  return u.replace(/\/+$/, "/");
}

function getShortcode(url: string): string | null {
  const m = url.match(
    /instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i
  );
  return m?.[1] || null;
}

function extractMeta(html: string, props: string[]): string | null {
  for (const prop of props) {
    const patterns = [
      new RegExp(
        `<meta[^>]*property=["']${prop}["'][^>]*content=["']([^"']+)["']`,
        "i"
      ),
      new RegExp(
        `<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${prop}["']`,
        "i"
      ),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]) return m[1].replace(/&amp;/g, "&");
    }
  }
  return null;
}

function findVideo(text: string): string | null {
  const patterns = [
    /"video_url"\s*:\s*"([^"]+)"/,
    /"contentUrl"\s*:\s*"(https:[^"]+\.mp4[^"]*)"/i,
    /"playable_url_quality_hd"\s*:\s*"([^"]+)"/,
    /"playable_url"\s*:\s*"([^"]+)"/,
    /(https:\/\/[^"'\s]+\.cdninstagram\.com[^"'\s]+\.mp4[^"'\s]*)/i,
    /(https:\/\/[^"'\s]+fbcdn\.net[^"'\s]+\.mp4[^"'\s]*)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      return m[1]
        .replace(/\\u0026/g, "&")
        .replace(/\\\//g, "/")
        .replace(/&amp;/g, "&");
    }
  }
  return null;
}

function findImage(text: string): string | null {
  const patterns = [
    /"display_url"\s*:\s*"([^"]+)"/,
    /"og:image"\s*content="([^"]+)"/,
    /(https:\/\/[^"'\s]+\.cdninstagram\.com[^"'\s]+\.(?:jpg|jpeg|webp)[^"'\s]*)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      return m[1]
        .replace(/\\u0026/g, "&")
        .replace(/\\\//g, "/")
        .replace(/&amp;/g, "&");
    }
  }
  return extractMeta(text, ["og:image", "og:image:secure_url"]);
}

async function fetchText(u: string) {
  const res = await fetch(u, {
    headers: { ...HEADERS },
    redirect: "follow",
  });
  if (!res.ok) return null;
  return res.text();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const raw = body?.url;
    if (!raw || typeof raw !== "string") {
      return NextResponse.json(
        { error: "Link Instagram wajib diisi" },
        { status: 400 }
      );
    }
    if (!/instagram\.com|instagr\.am/i.test(raw)) {
      return NextResponse.json(
        { error: "Link harus dari Instagram" },
        { status: 400 }
      );
    }

    // Buang ?igsh=... dll
    let clean = raw.trim().split("?")[0].split("#")[0];
    clean = clean.replace(/\/+$/, "/");
    if (!/^https?:\/\//i.test(clean)) clean = "https://" + clean;

    const shortcode = getShortcode(clean);
    let videoUrl: string | null = null;
    let imageUrl: string | null = null;
    let title: string | null = null;

    // A) oEmbed
    try {
      const oe = await fetch(
        "https://www.instagram.com/api/v1/oembed/?url=" +
          encodeURIComponent(clean),
        { headers: { "User-Agent": HEADERS["User-Agent"] } }
      );
      if (oe.ok) {
        const j = await oe.json();
        title = j.title || title;
        if (j.thumbnail_url) imageUrl = j.thumbnail_url;
      }
    } catch {
      /* skip */
    }

    // B) Embed
    if (shortcode) {
      try {
        const html = await (
          await fetch(
            `https://www.instagram.com/p/${shortcode}/embed/captioned/`,
            { headers: HEADERS }
          )
        ).text();
        const vtag = html.match(/<video[^>]+src="([^"]+)"/i);
        if (vtag?.[1]) videoUrl = vtag[1].replace(/&amp;/g, "&");
        videoUrl = videoUrl || findIn(html, "video");
        imageUrl = imageUrl || findIn(html, "image");
        title = title || extractMeta(html, ["og:title"]);
      } catch {
        /* skip */
      }
    }

    // C) ddinstagram
    if (shortcode && !videoUrl) {
      for (const host of [
        "https://www.ddinstagram.com",
        "https://ddinstagram.com",
      ]) {
        try {
          const html = await (
            await fetch(`\( {host}/p/ \){shortcode}/`, {
              headers: { ...HEADERS, Referer: host + "/" },
            })
          ).text();
          videoUrl =
            extractMeta(html, ["og:video", "og:video:secure_url"]) ||
            findVideo(html);
          imageUrl =
            imageUrl ||
            extractMeta(html, ["og:image"]) ||
            findImage(html);
          if (videoUrl) break;
        } catch {
          /* next */
        }
      }
    }

    // D) Proxy baca halaman (bypass bot wall)
    if (shortcode && !videoUrl) {
      try {
        const html = await (
          await fetch(
            "https://r.jina.ai/http://www.instagram.com/reel/" +
              shortcode +
              "/",
            { headers: { Accept: "text/plain" } }
          )
        ).text();
        videoUrl = findVideo(html) || videoUrl;
        imageUrl = imageUrl || findImage(html);
      } catch {
        /* skip */
      }
    }

    if (!videoUrl && !imageUrl) {
      return NextResponse.json(
        {
          error:
            "Media tidak ditemukan. Pastikan post/reel PUBLIK. Salin tautan dari app Instagram → Bagikan → Salin tautan.",
        },
        { status: 404 }
      );
    }

    const imageFinal = preferHdImage(imageUrl) || imageUrl;

    return NextResponse.json({
      title: title || "Instagram Media",
      videoUrl,
      imageUrl: imageFinal,
      imageHd: imageFinal,
      cover: imageFinal,
      downloadVideo: videoUrl
        ? proxyLink(videoUrl, "instagram-video.mp4")
        : null,
      downloadImage: imageFinal
        ? proxyLink(imageFinal, "instagram-foto-hd.jpg")
        : null,
    });
  } catch (err: any) {
    console.error("[instagram]", err);
    return NextResponse.json(
      { error: err?.message || "Gagal memproses Instagram" },
      { status: 500 }
    );
  }
}

function findVideo(text: string): string | null {
  const patterns = [
    /"video_url"\s*:\s*"([^"]+)"/,
    /"contentUrl"\s*:\s*"(https:[^"]+\.mp4[^"]*)"/i,
    /(https:\/\/[^"'\s]+\.cdninstagram\.com[^"'\s]+\.mp4[^"'\s]*)/i,
    /(https:\/\/[^"'\s]+fbcdn\.net[^"'\s]+\.mp4[^"'\s]*)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      return m[1]
        .replace(/\\u0026/g, "&")
        .replace(/\\\//g, "/")
        .replace(/&amp;/g, "&");
    }
  }
  return null;
}

function findImage(text: string): string | null {
  const patterns = [
    /"display_url"\s*:\s*"([^"]+)"/,
    /(https:\/\/[^"'\s]+\.cdninstagram\.com[^"'\s]+\.(?:jpg|jpeg|webp)[^"'\s]*)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      return m[1]
        .replace(/\\u0026/g, "&")
        .replace(/\\\//g, "/")
        .replace(/&amp;/g, "&");
    }
  }
  return extractMeta(text, ["og:image", "og:image:secure_url"]);
}
