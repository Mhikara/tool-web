import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const PYTHON = process.env.YTDLP_PYTHON || "python";

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

function runYtDlp(args: string[], maxOutput = 25 * 1024 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON, ["-m", "yt_dlp", "--js-runtimes", "node", ...args], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let exceeded = false;

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
      if (stdout.length > maxOutput) {
        exceeded = true;
        child.kill();
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr = (stderr + chunk.toString()).slice(-5000);
    });

    child.on("error", (error) => {
      reject(new Error(
        error.message.includes("ENOENT")
          ? `Python tidak ditemukan: ${PYTHON}`
          : error.message
      ));
    });

    child.on("close", (code) => {
      if (exceeded) {
        reject(new Error("Data video terlalu besar untuk diproses."));
      } else if (code !== 0) {
        reject(new Error(stderr.trim() || `yt-dlp berhenti dengan kode ${code}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

async function getVideoInfo(url: string) {
  const output = await runYtDlp([
    "--dump-single-json",
    "--skip-download",
    "--no-playlist",
    "--no-warnings",
    url,
  ]);

  return JSON.parse(output);
}

function getVideoFormats(formats: any[]) {
  const candidates = formats.filter((f) =>
    f.format_id &&
    /^\d+$/.test(String(f.format_id)) &&
    f.ext === "mp4" &&
    f.vcodec &&
    f.vcodec !== "none" &&
    String(f.vcodec).startsWith("avc1") &&
    f.height >= 144 &&
    f.height <= 1080 &&
    !String(f.protocol || "").includes("m3u8") &&
    !String(f.protocol || "").includes("dash")
  );

  const bestByHeight = new Map<number, any>();

  for (const format of candidates) {
    const previous = bestByHeight.get(format.height);
    if (
      !previous ||
      (format.tbr || 0) > (previous.tbr || 0) ||
      ((format.tbr || 0) === (previous.tbr || 0) &&
        (format.fps || 0) > (previous.fps || 0))
    ) {
      bestByHeight.set(format.height, format);
    }
  }

  return [...bestByHeight.values()]
    .sort((a, b) => a.height - b.height)
    .map((f) => ({
      itag: Number(f.format_id),
      quality: `${f.height}p`,
      height: f.height,
      fps: f.fps || null,
      hasAudio: f.acodec && f.acodec !== "none",
      size: f.filesize || f.filesize_approx
        ? (Number(f.filesize || f.filesize_approx) / 1024 / 1024).toFixed(1) + " MB"
        : null,
    }));
}

async function downloadFile(
  url: string,
  directory: string,
  format: "mp4" | "mp3",
  itag?: number
) {
  const outputTemplate = join(directory, "download.%(ext)s");
  const args = [
    "--no-playlist",
    "--no-warnings",
    "--no-part",
    "--output",
    outputTemplate,
  ];

  if (format === "mp3") {
    args.push(
      "--format", "bestaudio/best",
      "--extract-audio",
      "--audio-format", "mp3",
      "--audio-quality", "192K"
    );
  } else {
    if (!Number.isSafeInteger(itag) || !itag || itag < 1) {
      throw new Error("Pilihan resolusi tidak valid.");
    }

    args.push(
      "--format", `${itag}+bestaudio[ext=m4a]/${itag}+bestaudio`,
      "--merge-output-format", "mp4"
    );
  }

  args.push(url);
  await runYtDlp(args, 1024 * 1024);

  const files = await readdir(directory);
  const filename = format === "mp3" ? "download.mp3" : "download.mp4";

  if (!files.includes(filename)) {
    throw new Error("File hasil download tidak ditemukan. Periksa ketersediaan format dan FFmpeg.");
  }

  const filePath = join(directory, filename);
  const fileStat = await stat(filePath);

  if (!fileStat.isFile() || fileStat.size === 0) {
    throw new Error("File hasil download kosong atau tidak valid.");
  }

  return { filePath, size: fileStat.size };
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

    if (action === "info") {
      const info = await getVideoInfo(normalizedUrl);
      const details = info;

      return NextResponse.json({
        success: true,
        id: details.id,
        title: details.title,
        channel: details.channel || details.uploader || "-",
        duration: Number(details.duration || 0),
        thumbnail: details.thumbnail ||
          `https://i.ytimg.com/vi/${details.id}/hqdefault.jpg`,
        views: details.view_count,
        videoFormats: getVideoFormats(details.formats || []),
      });
    }

    if (action !== "download" || !["mp4", "mp3"].includes(format)) {
      return NextResponse.json(
        { error: "Permintaan download tidak valid." },
        { status: 400 }
      );
    }

    if (format === "mp4") {
      const info = await getVideoInfo(normalizedUrl);
      const available = getVideoFormats(info.formats || []);
      if (!available.some((f: any) => f.itag === itag)) {
        return NextResponse.json(
          { error: "Resolusi yang dipilih tidak tersedia." },
          { status: 400 }
        );
      }
    }

    directory = await mkdtemp(join(tmpdir(), "youtube-download-"));

    const result = await downloadFile(
      normalizedUrl,
      directory,
      format,
      itag
    );

    const title = safeFilename(
      format === "mp4"
        ? (await getVideoInfo(normalizedUrl)).title || "youtube"
        : "youtube-audio"
    );

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
          "Content-Type": format === "mp3" ? "audio/mpeg" : "video/mp4",
          "Content-Disposition": `attachment; filename="${filename}"`,
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

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[youtube]", message);

    return NextResponse.json(
      { error: "Gagal memproses YouTube: " + message },
      { status: 500 }
    );
  }
}
