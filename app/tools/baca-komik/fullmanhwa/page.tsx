"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Eye, EyeOff } from "lucide-react";

export default function FullManhwaProxyPage() {
  const [path, setPath] = useState("/");
  const [input, setInput] = useState("/");
  const [showImages, setShowImages] = useState(false);
  const [proxyUrl, setProxyUrl] = useState("/api/fullmanhwa?path=%2F");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const p = params.get("path") || "/";
      setPath(p);
      setInput(p);
    }
  }, []);

  useEffect(() => {
    setProxyUrl(`/api/fullmanhwa?path=${encodeURIComponent(path)}&img=${showImages}`);
  }, [path, showImages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPath(input);
    window.history.replaceState(null, "", `?path=${encodeURIComponent(input)}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Navbar */}
      <div className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-3">
          <Link href="/tools/baca-komik" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-bold tracking-tight">FullMan4 w-4" />
          </Link>
          <span className="font-bold tracking-tight">FullManhwa Clean</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowImages(!showImages)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
            >
              {showImages ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showImages ? "Sembunyi Gambar" : "Tampil Gambar"}
            </button>
            <a
              href={`https://fullmanhwa.com${path}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-500"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Asli
            </a>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-3 pb-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="/manga/... atau /chapter/..."
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-500"
            >
              Buka
            </button>
          </form>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-6xl">
        <iframe
          key={proxyUrl}
          src={proxyUrl}
          className="min-h-[85vh] w-full border-0 bg-zinc-950"
          sandbox="allow-same-origin allow-scripts allow-forms"
          title="FullManhwa Clean Reader"
        />
      </main>
    </div>
  );
}
