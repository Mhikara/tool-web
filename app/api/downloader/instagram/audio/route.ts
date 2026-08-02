import { NextRequest, NextResponse } from "next/server";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import os from "os";
import path from "path";

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath as string);

export async function POST(req: NextRequest) {
  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, `ig-in-${Date.now()}.mp4`);
  const outputPath = path.join(tempDir, `ig-out-${Date.now()}.mp3`);

  try {
    const { videoUrl } = await req.json();
    if (!videoUrl) {
      return NextResponse.json({ error: "URL video wajib diisi" }, { status: 400 });
    }

    const res = await fetch(videoUrl);
    if (!res.ok) throw new Error("Gagal mengambil video");
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(inputPath, buffer);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioCodec("libmp3lame")
        .save(outputPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err));
    });

    const audioBuffer = fs.readFileSync(outputPath);
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="instagram-audio.mp3"`,
      },
    });
  } catch (err) {
    console.error(err);
    try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
    return NextResponse.json({ error: "Gagal mengekstrak audio" }, { status: 500 });
  }
}
