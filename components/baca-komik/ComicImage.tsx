"use client";
import OcrTranslate from "@/components/baca-komik/OcrTranslate";

import { useState } from "react";

export default function ComicImage({
  src,
  alt,
  index,
}: {
  src: string;
  alt?: string;
  index: number;
}) {
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pastikan lewat proxy jika URL eksternal
  const finalSrc =
    src.startsWith("/api/komik/image") || src.startsWith("data:")
      ? src
      : src.startsWith("http")
        ? "/api/komik/image?url=" + encodeURIComponent(src)
        : src;

  if (err) {
    return (
      <div className="mx-auto flex min-h-[120px] max-w-3xl flex-col items-center justify-center gap-2 bg-zinc-900/50 py-8 text-sm text-zinc-500">
        <span>Gambar {index + 1} gagal dimuat</span>
        <button
          type="button"
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white"
          onClick={() => {
            setErr(false);
            setLoading(true);
          }}
        >
          Muat ulang
        </button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      {loading && (
        <div className="absolute inset-0 animate-pulse bg-zinc-800/40" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={finalSrc}
        alt={alt || `Halaman ${index + 1}`}
        loading={index < 2 ? "eager" : "lazy"}
        referrerPolicy="no-referrer"
        decoding="async"
        className="mx-auto block w-full bg-black/20"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setErr(true);
        }}
      />
      <div className="mt-1 flex justify-end px-2">
        <OcrTranslate imageUrl={typeof src === "string" ? src : ""} />
      </div>
    </div>
  );
}
