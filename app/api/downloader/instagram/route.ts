import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function cleanInstagramUrl(raw: string): string {
  let u = raw.trim();
  // hapus query ?igsh=...
  try {
    const parsed = new URL(u);
    parsed.search = "";
    parsed.hash = "";
    u = parsed.toString();
  } catch {
    u = u.split("?")[0].split("#")[0];
  }
  u = u.replace(/\/+$/, "/");
  return u;
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

function findVideoInText(text: string): string | null {
  const patterns = [
    /"video_url"\s*:\s*"([^"]+)"/,
    /"contentUrl"\s*:\s*"(https:[^"]+\.mp4[^"]*)"/i,
    /<meta[^>]+content=["'](https:[^"']+\.mp4[^"']*)["']/i,
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

function findImageInText(text: string): string | null {
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

function proxy(mediaUrl: string, filename: string) {
  return (
    "/api/downloader/instagram/file?url=" +
    encodeURIComponent(mediaUrl) +
    "&filename=" +
    encodeURIComponent(filename)
  );
}

async function fetchText(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "*/*", ...headers },
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

    const url = cleanInstagramUrl(raw);
    const shortcode = getShortcode(url);

    let videoUrl: string | null = null;
    let imageUrl: string | null = null;
    let title: string | null = null;

    // 1) oEmbed resmi (sering kasih thumbnail + title)
    try {
      const oe = await fetch(
        "https://www.instagram.com/api/v1/oembed/?url=" +
          encodeURIComponent(url),
        { headers: { "User-Agent": UA } }
      );
      if (oe.ok) {
        const j = await oe.json();
        title = j.title || title;
        if (j.thumbnail_url) imageUrl = j.thumbnail_url;
      }
    } catch {
      /* skip */
    }

    // 2) Embed page
    if (shortcode && (!videoUrl || !imageUrl)) {
      try {
        const html = await fetchText(
          `https://www.instagram.com/p/${shortcode}/embed/captioned/`,
          { Referer: "https://www.instagram.com/" }
        );
        if (html) {
          videoUrl = videoUrl || findVideoInText(html);
          const vtag = html.match(/<video[^>]+src="([^"]+)"/i);
          if (!videoUrl && vtag?.[1])
            videoUrl = vtag[1].replace(/&amp;/g, "&");
          imageUrl = imageUrl || findImageInText(html);
          title = title || extractMeta(html, ["og:title"]);
        }
      } catch {
        /* skip */
      }
    }

    // 3) ddinstagram mirror
    if (shortcode && !videoUrl) {
      for (const host of [
        "https://www.ddinstagram.com",
        "https://ddinstagram.com",
      ]) {
        try {
          const html = await fetchText(
            `\( {host}/p/ \){shortcode}/`,
            { Referer: host + "/" }
          );
          if (html) {
            videoUrl = videoUrl || extractMeta(html, [
              "og:video",
              "og:video:secure_url",
            ]);
            videoUrl = videoUrl || findVideoInText(html);
            imageUrl =
              imageUrl ||
              extractMeta(html, ["og:image"]) ||
              findImageInText(html);
            if (videoUrl) break;
          }
        } catch {
          /* next */
        }
      }
    }

    // 4) Proxy baca halaman (jina) — bypass sebagian bot-wall
    if (shortcode && !videoUrl) {
      try {
        const html = await fetchText(
          "https://r.jina.ai/http://www.instagram.com/reel/" +
            shortcode +
            "/",
          { Accept: "text/plain" }
        );
        if (html) {
          videoUrl = videoUrl || findVideoInText(html);
          imageUrl = imageUrl || findImageInText(html);
        }
      } catch {
        /* skip */
      }
    }

    // 5) Halaman asli terakhir
    if (!videoUrl && !imageUrl) {
      try {
        const html = await fetchText(url, {
          Referer: "https://www.instagram.com/",
        });
        if (html) {
          videoUrl = extractMeta(html, ["og:video", "og:video:secure_url"]);
          videoUrl = videoUrl || findVideoInText(html);
          imageUrl =
            imageUrl ||
            extractMeta(html, ["og:image"]) ||
            findImageInText(html);
          title = title || extractMeta(html, ["og:title"]);
        }
      } catch {
        /* skip */
      }
    }

    if (!videoUrl && !imageUrl) {
      return NextResponse.json(
        {
          error:
            "Media tidak ditemukan. Pastikan post/reel PUBLIK (bukan private). Coba salin link dari aplikasi → Bagikan → Salin tautan (tanpa perlu buka di browser login).",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      title: title || "Instagram Media",
      videoUrl,
      imageUrl,
      imageHd: imageUrl,
      cover: imageUrl,
      downloadVideo: videoUrl
        ? proxy(videoUrl, "instagram-video.mp4")
        : null,
      downloadImage: imageUrl
        ? proxy(imageUrl, "instagram-foto-hd.jpg")
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
