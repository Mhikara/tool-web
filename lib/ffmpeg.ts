import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import ffmpeg from "fluent-ffmpeg";

const require = createRequire(`${process.cwd()}/package.json`);

let staticPath: string | null = null;

try {
  staticPath = require("ffmpeg-static") as string | null;
} catch {
  staticPath = null;
}

const termuxPath = "/data/data/com.termux/files/usr/bin/ffmpeg";

const ffmpegPath =
  process.env.FFMPEG_PATH ||
  (existsSync(termuxPath) ? termuxPath : null) ||
  staticPath;

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

export default ffmpeg;
