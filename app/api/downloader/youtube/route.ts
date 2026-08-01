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
    const { url, format } = await req.json();

    const videoId = extractYoutubeId(url || "");
    if (!videoId) {
      return NextResponse.json(
        { error: "Link YouTube tidak valid (mendukung video biasa & Shorts)" },
        { status: 400 }
      );
    }
    const normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const info = await ytdl.getInfo(normalizedUrl);
    const safeTitle = info.videoDetails.title.replace(/[^\w\s-]/g, "").slice(0, 60);

    if (format === "mp3") {
      const stream = ytdl(normalizedUrl, { filter: "audioonly", quality: "highestaudio" });
      return new NextResponse(nodeToWebStream(stream), {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Disposition": `attachment; filename="${safeTitle}.mp3"`,
        },
      });
    }

    const stream = ytdl(normalizedUrl, { filter: "audioandvideo", quality: "highest" });
    return new NextResponse(nodeToWebStream(stream), {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${safeTitle}.mp4"`,
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: `Gagal memproses video YouTube: ${err?.message || "unknown error"}` },
      { status: 500 }
    );
  }
}
