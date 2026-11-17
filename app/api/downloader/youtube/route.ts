import { NextRequest, NextResponse } from "next/server";
import { Ytdl } from "@distube/ytdl-core";
import { spawn } from "node:child_process";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const yt = new Ytdl();

function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    let id: string | null = null;

    if (host === "youtu.be") {
      id = parsed.pathname.split("/")[1] || null;
    } else if (
      ["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)
    ) {
      id =
        parsed.searchParams.get("v") ||
        parsed.pathname.match(/^\/(?:shorts|embed)\/([a-zA-Z0-9_-]{11})/)?.[1] ||
        null;
    }

    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function safeFilename(value: string): string {
  return value
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80) || "youtube";
}

async function getVideoInfo(url: string) {
  return yt.getInfo(url);
}

function getVideoFormats(formats: any[]) {
  const candidates = formats.filter((f) =>
    f.itag &&
    f.container === "mp4" &&
    f.hasVideo &&
    !f.hasAudio &&
    String(f.videoCodec || "").startsWith("avc1") &&
    Number(f.height) >= 144 &&
    Number(f.height) <= 1080
  );

  const bestByHeight = new Map<number, any>();

  for (const format of candidates) {
    const previous = bestByHeight.get(format.height);
    if (
      !previous ||
      (format.bitrate || 0) > (previous.bitrate || 0) ||
      ((format.bitrate || 0) === (previous.bitrate || 0) &&
        (format.fps || 0) > (previous.fps || 0))
    ) {
      bestByHeight.set(format.height, format);
    }
  }

  return [...bestByHeight.values()]
    .sort((a, b) => a.height - b.height)
    .map((f) => ({
      itag: Number(f.itag),
      quality: `${f.height}p`,
      height: f.height,
      fps: f.fps || null,
      hasAudio: true,
      size: f.contentLength
        ? (Number(f.contentLength) / 1024 / 1024).toFixed(1) + " MB"
        : null,
    }));
}

function getFFmpegPath(): string {
  let ffmpegPath: unknown;

  try {
    ffmpegPath = require("ffmpeg-static");
  } catch {
    throw new Error("FFmpeg tidak tersedia pada server.");
  }

  if (
    typeof ffmpegPath !== "string" ||
    !existsSync(ffmpegPath)
  ) {
    throw new Error("Binary FFmpeg tidak ditemukan pada server.");
  }

  return ffmpegPath;
}

async function saveStream(stream: Readable, filePath: string) {
  await pipeline(stream, createWriteStream(filePath));
}

async function runFFmpeg(args: string[]) {
  const ffmpegPath = getFFmpegPath();

  await new Promise<void>((resolve, reject) => {
    const child = spawn(ffmpegPath, args, {
      stdio: ["ignore", "ignore", "pipe"],
    });

    let stderr = "";

    child.stderr.on("data", (chunk: Buffer) => {
      stderr = (stderr + chunk.toString()).slice(-5000);
    });

    child.on("error", (error) => reject(error));

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(
          stderr.trim() || `FFmpeg berhenti dengan kode ${code}`
        ));
      }
    });
  });
}

async function downloadFile(
  info: any,
  directory: string,
  format: "mp4" | "mp3",
  itag?: number
) {
  const formats = info.formats || [];
  const audioFormat = formats
    .filter((f: any) =>
      f.container === "mp4" &&
      f.hasAudio &&
      !f.hasVideo &&
      f.audioCodec
    )
    .sort((a: any, b: any) =>
      (b.audioBitrate || 0) - (a.audioBitrate || 0)
    )[0];

  if (!audioFormat) {
    throw new Error("Format audio M4A tidak tersedia.");
  }

  const audioPath = join(directory, "audio.m4a");
  const outputPath = join(
    directory,
    format === "mp4" ? "download.mp4" : "download.mp3"
  );

  if (format === "mp3") {
    await saveStream(
      yt.download(info, { format: audioFormat }),
      audioPath
    );

    await runFFmpeg([
      "-y",
      "-i", audioPath,
      "-vn",
      "-c:a", "libmp3lame",
      "-b:a", "192k",
      outputPath,
    ]);
  } else {
    if (!Number.isSafeInteger(itag) || !itag || itag < 1) {
      throw new Error("Pilihan resolusi tidak valid.");
    }

    const videoFormat = formats.find((f: any) =>
      Number(f.itag) === itag &&
      f.container === "mp4" &&
      f.hasVideo &&
      !f.hasAudio &&
      String(f.videoCodec || "").startsWith("avc1")
    );

    if (!videoFormat) {
      throw new Error("Resolusi video yang dipilih tidak tersedia.");
    }

    const videoPath = join(directory, "video.mp4");

    await Promise.all([
      saveStream(
        yt.download(info, { format: videoFormat }),
        videoPath
      ),
      saveStream(
        yt.download(info, { format: audioFormat }),
        audioPath
      ),
    ]);

    await runFFmpeg([
      "-y",
      "-i", videoPath,
      "-i", audioPath,
      "-map", "0:v:0",
      "-map", "1:a:0",
      "-c:v", "copy",
      "-c:a", "copy",
      "-movflags", "+faststart",
      outputPath,
    ]);
  }

  const fileStat = await stat(outputPath);

  if (!fileStat.isFile() || fileStat.size === 0) {
    throw new Error("File hasil download kosong atau tidak valid.");
  }

  return {
    filePath: outputPath,
    size: fileStat.size,
  };
}

export async function POST(req: NextRequest) {
  let directory: string | null = null;

  try {
    const body = await req.json().catch(() => null);
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    const action = body?.action || "info";
    const format = body?.format || "mp4";
    const itag = Number(body?.itag);

    const videoId = extractYoutubeId(url);

    if (!videoId) {
      return NextResponse.json(
        { error: "Link YouTube tidak valid." },
        { status: 400 }
      );
    }

    const normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await getVideoInfo(normalizedUrl);
    const details = info.videoDetails;

    if (action === "info") {
      return NextResponse.json({
        success: true,
        id: details.id,
        title: details.title,
        channel: details.author?.name || "-",
        duration: Number(details.lengthSeconds || 0),
        thumbnail:
          details.thumbnails?.at(-1)?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        views: Number(details.viewCount || 0),
        videoFormats: getVideoFormats(info.formats || []),
      });
    }

    if (
      action !== "download" ||
      !["mp4", "mp3"].includes(format)
    ) {
      return NextResponse.json(
        { error: "Permintaan download tidak valid." },
        { status: 400 }
      );
    }

    directory = await mkdtemp(
      join(tmpdir(), "youtube-download-")
    );

    const result = await downloadFile(
      info,
      directory,
      format as "mp4" | "mp3",
      itag
    );

    const title = safeFilename(details.title || "youtube");
    const filename = `${title}.${format}`;
    const fileStream = createReadStream(result.filePath);

    fileStream.on("close", () => {
      if (directory) {
        void rm(directory, { recursive: true, force: true });
      }
    });

    return new NextResponse(
      Readable.toWeb(fileStream) as ReadableStream,
      {
        headers: {
          "Content-Type":
            format === "mp3" ? "audio/mpeg" : "video/mp4",
          "Content-Disposition":
            `attachment; filename="${filename}"`,
          "Content-Length": String(result.size),
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (error: unknown) {
    if (directory) {
      await rm(directory, { recursive: true, force: true }).catch(() => {});
    }

    const message =
      error instanceof Error ? error.message : "Unknown error";

    console.error("[youtube]", message);

    return NextResponse.json(
      { error: "Gagal memproses YouTube: " + message },
      { status: 500 }
    );
  }
}
