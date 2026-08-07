import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.instagram.com/",
};

function getShortcode(url: string): string | null {
  const m = url.match(
    /instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i
  );
  return m?.[1] || null;
}

function decodeIg(s: string) {
  return s
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/")
    .replace(/\\"/g, '"')
    .replace(/&amp;/g, "&");
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
      if (m?.[1]) return decodeIg(m[1]);
    }
  }
  return null;
}

function findAllVideos(text: string): string[] {
  const out: string[] = [];
  const patterns = [
    /"video_url"\s*:\s*"([^"]+)"/g,
    /"playable_url_quality_hd"\s*:\s*"([^"]+)"/g,
    /"playable_url"\s*:\s*"([^"]+)"/g,
    /"contentUrl"\s*:\s*"(https:[^"]+\.mp4[^"]*)"/gi,
    /<meta[^>]+content=["'](https:[^"']+\.mp4[^"']*)["']/gi,
    /<video[^>]+src=["']([^"']+)["']/gi,
    /(https:\/\/[^"'\s\\]+(?:cdninstagram\.com|fbcdn\.net)[^"'\s\\]*\.mp4[^"'\s\\]*)/gi,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    while ((m = r.exec(text)) !== null) {
      const u = decodeIg(m[1]);
      if (u && (u.includes(".mp4") || u.includes("video")) && !out.includes(u)) {
        out.push(u);
      }
    }
  }
  return out;
}

function findImage(text: string): string | null {
  return (
    extractMeta(text, ["og:image", "og:image:secure_url"]) ||
    (() => {
      const m = text.match(/"display_url"\s*:\s*"([^"]+)"/);
      return m?.[1] ? decodeIg(m[1]) : null;
    })()
  );
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

    let clean = raw.trim().split("?")[0].split("#")[0];
    clean = clean.replace(/\/+$/, "/");
    if (!/^https?:\/\//i.test(clean)) clean = "https://" + clean;

    const shortcode = getShortcode(clean);
    let videoUrl: string | null = null;
    let imageUrl: string | null = null;
    let title: string | null = null;
    const videos: string[] = [];

    // 1) oEmbed (biasanya thumbnail saja)
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

    // 2) Embed — sumber video paling sering
    if (shortcode) {
      try {
        const embedRes = await fetch(
          `https://www.instagram.com/reel/${shortcode}/embed/captioned/`,
          { headers: HEADERS }
        );
        const html = await embedRes.text();
        for (const v of findAllVideos(html)) videos.push(v);
        const vtag = html.match(/<video[^>]+src=["']([^"']+)["']/i);
        if (vtag?.[1]) videos.unshift(decodeIg(vtag[1]));
        imageUrl = imageUrl || findImage(html);
        title = title || extractMeta(html, ["og:title"]);
      } catch {
        /* skip */
      }

      try {
        const embed2 = await fetch(
          `https://www.instagram.com/p/${shortcode}/embed/captioned/`,
          { headers: HEADERS }
        );
        const html = await embed2.text();
        for (const v of findAllVideos(html)) {
          if (!videos.includes(v)) videos.push(v);
        }
        imageUrl = imageUrl || findImage(html);
      } catch {
        /* skip */
      }
    }

    // 3) ddinstagram
    if (shortcode) {
      for (const host of [
        "https://www.ddinstagram.com",
        "https://ddinstagram.com",
      ]) {
        try {
          const r = await fetch(`\( {host}/reel/ \){shortcode}/`, {
            headers: { ...HEADERS, Referer: host + "/" },
          });
          const html = await r.text();
          const ogv = extractMeta(html, ["og:video", "og:video:secure_url"]);
          if (ogv && !videos.includes(ogv)) videos.push(ogv);
          for (const v of findAllVideos(html)) {
            if (!videos.includes(v)) videos.push(v);
          }
          imageUrl = imageUrl || extractMeta(html, ["og:image"]) || findImage(html);
          if (videos.length) break;
        } catch {
          /* next */
        }
      }
    }

    // 4) jina proxy
    if (shortcode && videos.length === 0) {
      try {
        const r = await fetch(
          "https://r.jina.ai/http://www.instagram.com/reel/" + shortcode + "/",
          { headers: { Accept: "text/plain" } }
        );
        const html = await r.text();
        for (const v of findAllVideos(html)) {
          if (!videos.includes(v)) videos.push(v);
        }
        imageUrl = imageUrl || findImage(html);
      } catch {
        /* skip */
      }
    }

    // pilih video: prioritaskan yang ada .mp4 dan bukan preview kecil
    videoUrl =
      videos.find((v) => v.includes(".mp4") && !v.includes("jpg")) ||
      videos[0] ||
      null;

    if (!videoUrl && !imageUrl) {
      return NextResponse.json(
        {
          error:
            "Media tidak ditemukan. Reel private atau Instagram memblokir server.",
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
      hasVideo: Boolean(videoUrl),
      downloadVideo: videoUrl
        ? proxyLink(videoUrl, "instagram-reel.mp4")
        : null,
      downloadImage: imageUrl
        ? proxyLink(imageUrl, "instagram-cover.jpg")
        : null,
      note: videoUrl
        ? null
        : "Hanya cover/foto yang ditemukan. Video diblokir Instagram dari server.",
    });
  } catch (err: any) {
    console.error("[instagram]", err);
    return NextResponse.json(
      { error: err?.message || "Gagal memproses Instagram" },
      { status: 500 }
    );
  }
}
