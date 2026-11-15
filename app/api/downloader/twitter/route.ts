import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";

export const runtime = "nodejs";
export const maxDuration = 30;

function parseTweetUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) return null;

  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();

    if (
      url.protocol !== "https:" ||
      !["x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"].includes(host)
    ) return null;

    const match = url.pathname.match(/^\/([A-Za-z0-9_]{1,15})\/status\/(\d+)/);
    if (!match) return null;

    return { username: match[1], id: match[2] };
  } catch {
    return null;
  }
}

function validMediaUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "video.twimg.com"
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action || "info";

    if (action === "download") {
      const mediaUrl = body?.mediaUrl;

      if (!validMediaUrl(mediaUrl)) {
        return NextResponse.json(
          { error: "URL video tidak valid." },
          { status: 400 }
        );
      }

      const fileRes = await fetch(mediaUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(25000),
      });

      if (!fileRes.ok || !fileRes.body) {
        return NextResponse.json(
          { error: "Gagal mengambil file video." },
          { status: 502 }
        );
      }

      const headers = new Headers({
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="x-twitter-video.mp4"',
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });

      const length = fileRes.headers.get("content-length");
      if (length) headers.set("Content-Length", length);

      return new NextResponse(fileRes.body, {
        status: 200,
        headers,
      });
    }

    if (action !== "info") {
      return NextResponse.json(
        { error: "Aksi tidak valid." },
        { status: 400 }
      );
    }

    const tweet = parseTweetUrl(body?.url);

    if (!tweet) {
      return NextResponse.json(
        { error: "Masukkan link postingan X/Twitter yang valid." },
        { status: 400 }
      );
    }

    const apiUrl =
      `https://api.vxtwitter.com/${tweet.username}/status/${tweet.id}`;

    const raw = await new Promise<string>((resolve, reject) => {
      execFile(
        "curl",
        [
          "-fLsS",
          "--max-time", "15",
          apiUrl,
        ],
        { maxBuffer: 2 * 1024 * 1024 },
        (error, stdout) => {
          if (error) reject(error);
          else resolve(stdout);
        }
      );
    });

    const data = JSON.parse(raw);
    const media = Array.isArray(data?.media_extended)
      ? data.media_extended
      : [];

    const videos = media.filter(
      (item: any) =>
        (item?.type === "video" || item?.type === "gif") &&
        validMediaUrl(item?.url)
    );

    if (!videos.length) {
      return NextResponse.json(
        { error: "Postingan ini tidak memiliki video yang bisa diunduh." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      title: data.text || "Video X/Twitter",
      author: data.user_name || data.user_screen_name || "Unknown",
      username: data.user_screen_name || tweet.username,
      thumbnail: videos[0].thumbnail_url || null,
      duration: videos[0].duration_millis || null,
      mediaUrl: videos[0].url,
      tweetUrl: data.tweetURL || body.url,
    });
  } catch (error) {
    console.error("[twitter-downloader]", error);

    return NextResponse.json(
      { error: "Gagal memproses postingan X/Twitter." },
      { status: 500 }
    );
  }
}
