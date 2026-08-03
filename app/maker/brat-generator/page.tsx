"use client";

import { useState, useRef, useCallback } from "react";
import { Wand2, Download, Image as ImageIcon, Film } from "lucide-react";

type Mode = "static" | "gif";

const CANVAS_SIZE = 640;
const GIF_FRAME_COUNT = 24;
const GIF_FRAME_DELAY = 60;

function drawBratFrame(
  ctx: CanvasRenderingContext2D,
  text: string,
  progress: number
) {
  const { width, height } = ctx.canvas;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const displayText = text.trim() || "brat";
  const wobble = 1 + Math.sin(progress * Math.PI * 2) * 0.03;

  const padding = width * 0.12;
  const maxWidth = width - padding * 2;
  let fontSize = height * 0.28;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#0a0a0a";

  while (fontSize > 12) {
    ctx.font = `700 ${fontSize}px Arial, sans-serif`;
    if (ctx.measureText(displayText).width <= maxWidth) break;
    fontSize -= 2;
  }

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(wobble, wobble);
  ctx.fillText(displayText, 0, 0);
  ctx.restore();
}

export default function BratGeneratorPage() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("static");
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultType, setResultType] = useState<"png" | "gif" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateStatic = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    drawBratFrame(ctx, text, 0);
    setResultUrl(canvas.toDataURL("image/png"));
    setResultType("png");
  }, [text]);

  const generateGif = useCallback(async () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { default: GIF } = await import("gif.js");

    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: canvas.width,
      height: canvas.height,
      workerScript: "/gif.worker.js",
    });

    for (let i = 0; i < GIF_FRAME_COUNT; i++) {
      drawBratFrame(ctx, text, i / GIF_FRAME_COUNT);
      gif.addFrame(ctx, { copy: true, delay: GIF_FRAME_DELAY });
    }

    await new Promise<void>((resolve, reject) => {
      gif.on("finished", (blob) => {
        setResultUrl(URL.createObjectURL(blob));
        setResultType("gif");
        resolve();
      });
      gif.on("abort", () => reject(new Error("Proses GIF dibatalkan")));
      gif.render();
    });
  }, [text]);

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError("Isi teks dulu sebelum generate.");
      return;
    }
    setError(null);
    setGenerating(true);
    setResultUrl(null);
    try {
      if (mode === "static") {
        generateStatic();
      } else {
        await generateGif();
      }
    } catch (err) {
      console.error("[brat-generator]", err);
      setError("Gagal membuat gambar. Coba lagi.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl || !resultType) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `brat.${resultType}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-8 md:px-8">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <Wand2 className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">BRAT Generator</h1>
            <p className="text-sm text-zinc-400">
              Buat gambar BRAT statis atau animasi GIF dari teks kamu
            </p>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 mb-6 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Bisa static PNG atau animated GIF
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Halo"
              maxLength={60}
              className="input-field w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("static")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "static"
                  ? "bg-amber-500 text-black"
                  : "bg-white/10 text-zinc-300 hover:bg-white/15"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Static
            </button>
            <button
              onClick={() => setMode("gif")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "gif"
                  ? "bg-amber-500 text-black"
                  : "bg-white/10 text-zinc-300 hover:bg-white/15"
              }`}
            >
              <Film className="w-4 h-4" />
              Animated GIF
            </button>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-amber-400 text-black disabled:opacity-50"
          >
            {generating ? "Membuat..." : "⚡ Generate BRAT"}
          </button>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className={`w-full h-auto rounded-xl border border-white/10 bg-white ${
                resultType === "gif" && resultUrl ? "hidden" : ""
              }`}
            />
            {resultType === "gif" && resultUrl && (
              <img
                src={resultUrl}
                alt="Hasil BRAT animasi"
                className="w-full h-auto rounded-xl border border-white/10 bg-white"
              />
            )}
          </div>

          {resultUrl && (
            <button
              onClick={handleDownload}
              className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download {resultType === "gif" ? "GIF" : "PNG"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
