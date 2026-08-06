import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.instagram.com/",
};

function getShortcode(url: string): string | null {
  const match = url.match(
    /instagram\.com\/(?:reel|p|tv|reels)\/([A-Za-z0-9_-]+)/
  );
  return match?.[1] || null;
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

function proxyLink(mediaUrl: string, filename: string) {
  return (
    "/api/downloader/instagram/file?url=" +
    encodeURIComponent(mediaUrl) +
    "&filename=" +
    encodeURIComponent(filename)
  );
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Link Instagram wajib diisi" },
        { status: 400 }
      );
    }
    if (!url.includes("instagram.com")) {
      return NextResponse.json(
        { error: "Link harus dari Instagram" },
        { status: 400 }
      );
    }

    const shortcode = getShortcode(url);
    let videoUrl: string | null = null;
    let imageUrl: string | null = null;
    let title: string | null = null;

    if (shortcode) {
      try {
        const embedRes = await fetch(
          "https://www.instagram.com/p/" + shortcode + "/embed/captioned/",
          { headers: HEADERS }
        );
        const html = await embedRes.text();

        const videoTag = html.match(/<video[^>]*src="([^"]+)"/i);
        if (videoTag?.[1]) videoUrl = videoTag[1].replace(/&amp;/g, "&");

        if (!videoUrl) {
          const jsonVideo = html.match(/"video_url":"([^"]+)"/);
          if (jsonVideo?.[1]) {
            videoUrl = jsonVideo[1]
              .replace(/\\u0026/g, "&")
              .replace(/\\\//g, "/");
          }
        }

        const imgTag = html.match(
          /<img[^>]*class="[^"]*EmbeddedMediaImage[^"]*"[^>]*src="([^"]+)"/i
        );
        if (imgTag?.[1]) imageUrl = imgTag[1].replace(/&amp;/g, "&");

        title = extractMeta(html, ["og:title"]);
      } catch {
        /* lanjut */
      }
    }

    if (!videoUrl && !imageUrl) {
      try {
        const res = await fetch(url, { headers: HEADERS, redirect: "follow" });
        const html = await res.text();
        videoUrl = extractMeta(html, ["og:video", "og:video:secure_url"]);
        imageUrl = extractMeta(html, ["og:image", "og:image:secure_url"]);
        title = extractMeta(html, ["og:title"]);
        if (!videoUrl) {
          const jsonVideo = html.match(/"video_url":"([^"]+)"/);
          if (jsonVideo?.[1]) {
            videoUrl = jsonVideo[1]
              .replace(/\\u0026/g, "&")
              .replace(/\\\//g, "/");
          }
        }
      } catch {
        /* lanjut */
      }
    }

    if (!videoUrl && !imageUrl && shortcode) {
      try {
        const dd = await fetch(
          "https://www.ddinstagram.com/p/" + shortcode + "/",
          { headers: HEADERS, redirect: "follow" }
        );
        const html = await dd.text();
        videoUrl = extractMeta(html, ["og:video", "og:video:secure_url"]);
        imageUrl = extractMeta(html, ["og:image"]);
      } catch {
        /* skip */
      }
    }

    if (!videoUrl && !imageUrl) {
      return NextResponse.json(
        {
          error:
            "Media tidak ditemukan. Post private, carousel, atau diblokir.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      title: title || "Instagram Media",
      videoUrl: videoUrl || null,
      imageUrl: imageUrl || null,
      cover: imageUrl || null,
      downloadVideo: videoUrl
        ? proxyLink(videoUrl, "instagram-video.mp4")
        : null,
      downloadImage: imageUrl
        ? proxyLink(imageUrl, "instagram-foto.jpg")
        : null,
    });
  } catch (err: any) {
    console.error("[instagram]", err);
    return NextResponse.json(
      { error: err?.message || "Gagal memproses link Instagram" },
      { status: 500 }
    );
  }
}
