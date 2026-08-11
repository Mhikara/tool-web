"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Eye, EyeOff, Settings2, X } from "lucide-react";

export default function FullManhwaProxyPage() {
  const [path, setPath] = useState("/");
  const [input, setInput] = useState("/");
  const [showImages, setShowImages] = useState(true);
  const [iframeSrc, setIframeSrc] = useState("/api/fullmanhwa?path=%2F");
  const [showBar, setShowBar] = useState(false);
  const [immersive, setImmersive] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const p = params.get("path") || "/";
    setPath(p);
    setInput(p);
    // path chapter → auto immersif
    if (p.includes("chapter") || p.split("/").filter(Boolean).length >= 2) {
      setImmersive(true);
      setShowBar(false);
    }
  }, []);

  useEffect(() => {
    setIframeSrc(
      "/api/fullmanhwa?path=" +
        encodeURIComponent(path) +
        "&img=" +
        (showImages ? "1" : "0")
    );
  }, [path, showImages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = input.trim() || "/";
    setPath(next);
    setImmersive(true);
    setShowBar(false);
    if (typeof window !== "undefined") {
      window.history.replaceState(
        null,
        "",
        "?path=" + encodeURIComponent(next)
      );
    }
  };

  const toggleBar = useCallback(() => {
    setShowBar((v) => !v);
  }, []);

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header tipis — selalu ada, tanpa path */}
      <div className="sticky top-0 z-50 flex items-center gap-2 border-b border-zinc-800/80 bg-zinc-950/90 px-3 py-2 backdrop-blur-md">
        <Link
          href="/tools/baca-komik"
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="truncate text-sm font-semibold text-zinc-300">
          FullManhwa
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowImages((v) => !v)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            title={showImages ? "Sembunyi gambar" : "Tampil gambar"}
          >
            {showImages ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </button>
          <a
            href={"https://fullmanhwa.com" + path}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-violet-300"
            title="Buka di fullmanhwa.com"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={toggleBar}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            title="Path / navigasi"
          >
            {showBar ? <X className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Path bar — HANYA jika user buka gear */}
      {showBar && (
        <div className="z-40 border-b border-zinc-800 bg-zinc-900 px-3 py-2">
          <form onSubmit={handleSubmit} className="mx-auto flex max-w-6xl gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="/manga/.../chapter-1"
              className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white"
            >
              Buka
            </button>
          </form>
          <p className="mx-auto mt-1 max-w-6xl text-[10px] text-zinc-500">
            Path hanya untuk navigasi. Saat baca, tutup panel ini (ikon gear).
          </p>
        </div>
      )}

      <main
        className={immersive ? "mx-auto w-full max-w-3xl" : "mx-auto max-w-6xl"}
      >
        <iframe
          key={iframeSrc}
          src={iframeSrc}
          className="min-h-[90vh] w-full border-0 bg-zinc-950"
          sandbox="allow-same-origin allow-scripts allow-forms"
          title="FullManhwa Reader"
        />
      </main>
    </div>
  );
}
