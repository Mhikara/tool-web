"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

type Props = {
  src: string;
  alt?: string;
  className?: string;
};

export default function ComicImage({ src, alt = "", className = "" }: Props) {
  const [err, setErr] = useState(false);
  const [key, setKey] = useState(0);

  if (err) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 bg-zinc-900 py-10">
        <p className="text-sm text-zinc-400">Gambar gagal dimuat</p>
        <button
          type="button"
          onClick={() => {
            setErr(false);
            setKey((k) => k + 1);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white"
        >
          <RefreshCw className="h-4 w-4" /> Muat ulang gambar
        </button>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={key}
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setErr(true)}
      className={className || "mx-auto block w-full bg-zinc-900"}
      draggable={false}
    />
  );
}
