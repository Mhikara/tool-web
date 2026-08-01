import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

export const runtime = "nodejs";

function nodeToWebStream(nodeStream: NodeJS.ReadableStream): ReadableStream {
  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => controller.enqueue(chunk));
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { url, format } = await req.json(); // format: "mp3" | "mp4"

    if (!url || !ytdl.validateURL(url)) {
      return NextResponse.json({ error: "Link YouTube tidak valid" }, { status: 400 });
    }

    const info = await ytdl.getInfo(url);
    const safeTitle = info.videoDetails.title.replace(/[^\w\s-]/g, "").slice(0, 60);

    if (format === "mp3") {
      const stream = ytdl(url, { filter: "audioonly", quality: "highestaudio" });
      return new NextResponse(nodeToWebStream(stream), {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Disposition": `attachment; filename="${safeTitle}.mp3"`,
        },
      });
    }

    const stream = ytdl(url, { filter: "audioandvideo", quality: "highest" });
    return new NextResponse(nodeToWebStream(stream), {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${safeTitle}.mp4"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memproses video YouTube" }, { status: 500 });
  }
}
