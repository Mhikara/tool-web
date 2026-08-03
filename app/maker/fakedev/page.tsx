"use client";

import { useState } from "react";
import { User, Download, RefreshCw, Image as ImageIcon } from "lucide-react";

export default function FakeDevPage() {
  const [nama, setNama] = useState("Developer");
  const [bio, setBio] = useState("Full Stack Developer");
  const [foto, setFoto] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Belum diuji");

  const handleGenerate = async () => {
    if (!nama.trim()) {
      setError("Nama developer wajib diisi.");
      return;
    }
    setError(null);
    setLoading(true);
    setResultUrl(null);
    setStatus("Sedang generate...");

    try {
      const params = new URLSearchParams({
        name: nama.trim(),
        bio: bio.trim() || "Developer",
      });
      if (foto.trim()) params.set("image", foto.trim());

      // Proxy lewat API route project biar aman dari CORS
      const res = await fetch(`/api/maker/fakedev?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal generate gambar");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setStatus("Berhasil digenerate");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Gagal generate. Coba lagi.");
      setStatus("Gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `fakedev-${nama.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="min-h-screen bg-[#0B0710] text-[#F3EEFA] px-4 py-6 md:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <User className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <div className="text-xs text-violet-400 font-semibold tracking-wide">
              NEXUS SOURCE API
            </div>
            <h1 className="text-xl font-bold">FakeDev</h1>
            <p className="text-sm text-zinc-400">
              Generator profil developer — nama, bio & foto opsional
            </p>
          </div>
        </div>

        {/* Card utama */}
        <div className="rounded-2xl border border-white/10 bg-[#1C1226]/80 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-violet-400" />
            <span className="font-semibold">FakeDev Profile</span>
          </div>
          <p className="text-xs text-zinc-400 mb-4">
            Hasil gambar dibuat dari API. Bukan canvas lokal.
          </p>

          {/* Status */}
          <div className="flex items-center gap-2 mb-5 text-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                status.includes("Berhasil")
                  ? "bg-green-500"
                  : status.includes("Gagal")
                  ? "bg-red-500"
                  : "bg-yellow-500"
              }`}
            />
            <span className="text-zinc-300">{status}</span>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Form kiri */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">
                  NAMA DEVELOPER
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Developer"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0B0710] border border-white/10 text-sm focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">
                  BIO / STATUS
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Full Stack Developer"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0B0710] border border-white/10 text-sm focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">
                  URL FOTO PROFIL — OPSIONAL
                </label>
                <input
                  type="url"
                  value={foto}
                  onChange={(e) => setFoto(e.target.value)}
                  placeholder="https://example.com/foto.jpg"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0B0710] border border-white/10 text-sm focus:outline-none focus:border-violet-500"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    Generate Profile
                  </>
                )}
              </button>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
            </div>

            {/* Preview kanan */}
            <div className="rounded-xl border border-white/10 bg-[#0B0710] min-h-[280px] flex flex-col items-center justify-center p-4">
              {resultUrl ? (
                <img
                  src={resultUrl}
                  alt="Hasil FakeDev"
                  className="max-w-full max-h-[320px] rounded-lg object-contain"
                />
              ) : (
                <div className="text-center text-zinc-500">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Hasil FakeDev akan muncul di sini</p>
                </div>
              )}
            </div>
          </div>

          {/* Download */}
          {resultUrl && (
            <button
              onClick={handleDownload}
              className="mt-5 w-full py-3 rounded-xl font-medium bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
