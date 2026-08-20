"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id as string;
  const rawChapter = params.chapter as string;
  
  const comicId = decodeURIComponent(rawId || "");
  const chapterId = decodeURIComponent(rawChapter || "");

  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getProxiedUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("/api/komik/image")) return url;
    return `/api/komik/image?url=${encodeURIComponent(url)}`;
  };

  useEffect(() => {
    if (!comicId || !chapterId) {
      setError("Parameter komik atau chapter tidak valid.");
      setLoading(false);
      return;
    }

    const fetchChapter = async () => {
      try {
        const res = await fetch(`/api/komik?action=read&id=${encodeURIComponent(comicId)}&chapter=${encodeURIComponent(chapterId)}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Gagal memuat chapter.");
        }

        const imgList = data.images || data.chapter?.images || data.data?.images || [];
        if (imgList.length === 0) {
          throw new Error("Tidak ada halaman gambar yang ditemukan pada chapter ini.");
        }

        setImages(imgList);
      } catch (err: any) {
        setError(err.message || "Gagal membuka chapter.");
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, [comicId, chapterId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-red-500" />
        <p className="text-sm font-medium">Menyiapkan lembar komik...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-200 mb-2">Gagal Membuka Chapter</h2>
        <p className="text-gray-400 text-sm max-w-md mb-8">{error}</p>
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl transition-colors font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Detail Komik
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Floating Navigation */}
      <div className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur border-b border-gray-800/80 px-4 py-3 flex items-center justify-between">
        <Link 
          href={`/tools/baca-komik/${encodeURIComponent(comicId)}`}
          className="p-2 rounded-xl bg-gray-900 text-gray-400 hover:text-white border border-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="text-center min-w-0 px-2">
          <p className="text-xs text-gray-400 truncate max-w-[200px]">{comicId.split(":")[1]?.replace(/-/g, " ") || "Komik"}</p>
          <h1 className="text-sm font-bold text-gray-200 truncate max-w-[200px]">{chapterId}</h1>
        </div>
        <div className="text-xs bg-red-600/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg font-mono font-bold">
          {images.length} Hal
        </div>
      </div>

      {/* Reader Images Container */}
      <div className="flex flex-col items-center max-w-3xl mx-auto pb-24 select-none">
        {images.map((imgUrl, idx) => (
          <img
            key={idx}
            src={getProxiedUrl(imgUrl)}
            alt={`Halaman ${idx + 1}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-auto min-h-[250px] object-cover bg-gray-900 border-b border-gray-900"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              // Fallback jika lewat proxy lokal gagal: coba load langsung URL asli
              if (target.src.includes("/api/komik/image?url=")) {
                target.src = imgUrl;
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
