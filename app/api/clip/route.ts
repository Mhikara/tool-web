import { NextRequest, NextResponse } from "next/server";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import os from "os";
import path from "path";
import { PassThrough } from "stream";

export const runtime = "nodejs";
export const maxDuration = 60;

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath as string);

function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
}

function cutClip(
  inputPath: string,
  outputPath: string,
  start: number,
  duration: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(start)
      .setDuration(duration)
      .outputOptions("-c copy")
      .save(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });
}

export async function POST(req: NextRequest) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "clip-"));
  const inputPath = path.join(tempDir, "input.mp4");

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const clipDuration = Number(formData.get("clipDuration")) || 30;

    if (!file) {
      return NextResponse.json(
        { error: "File video wajib diupload" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(inputPath, buffer);

    const totalDuration = await getVideoDuration(inputPath);
    if (!totalDuration || totalDuration <= 0) {
      return NextResponse.json(
        { error: "Tidak bisa membaca durasi video" },
        { status: 400 }
      );
    }

    const archiverMod: any = await import("archiver");
    const archiver = (archiverMod.default || archiverMod) as (
      format: string,
      options?: { zlib?: { level: number } }
    ) => any;

    const clipCount = Math.ceil(totalDuration / clipDuration);
    const maxClips = 15;
    const clampedCount = Math.min(clipCount, maxClips);

    const archive = archiver("zip", { zlib: { level: 9 } });
    const passthrough = new PassThrough();
    archive.pipe(passthrough);

    for (let i = 0; i < clampedCount; i++) {
      const start = i * clipDuration;
      const remaining = totalDuration - start;
      const duration = Math.min(clipDuration, remaining);
      if (duration <= 0) break;

      const clipPath = path.join(tempDir, "clip-" + (i + 1) + ".mp4");
      await cutClip(inputPath, clipPath, start, duration);
      archive.file(clipPath, { name: "clip-" + (i + 1) + ".mp4" });
    }

    archive.finalize();

    const chunks: Buffer[] = [];
    for await (const chunk of passthrough) {
      chunks.push(chunk as Buffer);
    }
    const zipBuffer = Buffer.concat(chunks);

    fs.rmSync(tempDir, { recursive: true, force: true });

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="clips.zip"',
      },
    });
  } catch (err: any) {
    console.error(err);
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
    return NextResponse.json(
      { error: "Gagal memproses video: " + (err?.message || "unknown error") },
      { status: 500 }
    );
  }
}
