import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

export const runtime = "nodejs";
export const maxDuration = 60;

function nodeToWebStream(nodeStream: NodeJS.ReadableStream): ReadableStream {
  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => controller.enqueue(chunk));
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
  });
}

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, action = "info", itag, format } = body;

    const videoId = extractYoutubeId(url || "");
    if (!videoId) {
      return NextResponse.json(
        { error: "Link YouTube tidak valid (mendukung video biasa & Shorts)" },
        { status: 400 }
      );
    }
    const normalizedUrl = "https://www.youtube.com/watch?v=" + videoId;

    if (action === "info") {
      const info = await ytdl.getInfo(normalizedUrl);
      const details = info.videoDetails;

      const videoFormats = info.formats
        .filter(
          (f) =>
            f.hasVideo &&
            f.container === "mp4" &&
            f.contentLength &&
            !f.isLive &&
            !f.isHLS &&
            !f.isDashMPD
        )
        .map((f) => ({
          itag: f.itag,
          quality: f.qualityLabel || f.quality || "unknown",
          hasAudio: f.hasAudio,
          size: f.contentLength
            ? (Number(f.contentLength) / 1024 / 1024).toFixed(1) + " MB"
            : null,
          fps: f.fps || null,
        }))
        .filter((f, i, arr) => arr.findIndex((x) => x.quality === f.quality) === i)
        .sort((a, b) => (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0));

      return NextResponse.json({
        id: details.videoId,
        title: details.title,
        channel: details.author?.name || details.ownerChannelName || "-",
        duration: Number(details.lengthSeconds),
        thumbnail:
          details.thumbnails?.[details.thumbnails.length - 1]?.url ||
          "https://i.ytimg.com/vi/" + details.videoId + "/hqdefault.jpg",
        views: details.viewCount,
        videoFormats,
      });
    }

    const info = await ytdl.getInfo(normalizedUrl);
    const safeTitle = info.videoDetails.title.replace(/[^\w\s-]/g, "").slice(0, 60);

    if (format === "mp3") {
      const stream = ytdl(normalizedUrl, { filter: "audioonly", quality: "highestaudio" });
      return new NextResponse(nodeToWebStream(stream), {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Disposition": 'attachment; filename="' + safeTitle + '.mp3"',
          "Cache-Control": "private, no-store",
        },
      });
    }

    const options: ytdl.downloadOptions = itag
      ? { quality: itag }
      : { filter: "audioandvideo", quality: "highest" };

    const stream = ytdl(normalizedUrl, options);
    return new NextResponse(nodeToWebStream(stream), {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="' + safeTitle + '.mp4"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err: any) {
    console.error("[youtube]", err);
    return NextResponse.json(
      { error: "Gagal memproses video YouTube: " + (err?.message || "unknown") },
      { status: 500 }
    );
  }
}
