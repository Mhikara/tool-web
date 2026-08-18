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
  
  // PERBAIKAN: Decode URI Component agar ID komples tidak rusak
  const comicId = decodeURIComponent(rawId);
  const chapterId = decodeURIComponent(rawChapter);

  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // PERBAIKAN: Cek sumber FullManhwa
    if (comicId.startsWith("fm:")) {
      setError("Sumber FullManhwa sedang tidak stabil (Sering HTTP 500). Silakan baca komik ini melalui sumber MangaDex, Omega, atau Komiku.");
      setLoading(false);
      return;
    }

    const fetchChapter = async () => {
      try {
        const res = await fetch(`/api/komik?action=read&id=${encodeURIComponent(comicId)}&chapter=${encodeURIComponent(chapterId)}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Gagal memuat chapter");
        setImages(data.images || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, [comicId, chapterId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
        <p>Menyiapkan gambar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-200 mb-2">Gagal Membuka Chapter</h2>
        <p className="text-gray-400 max-w-md mb-8">{error}</p>
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800 p-4 flex items-center justify-between">
        <Link 
          href={`/tools/baca-komik/${encodeURIComponent(comicId)}`}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <span className="text-gray-200 font-medium text-sm truncate max-w-[200px]">
          {chapterId}
        </span>
        <div className="w-6" /> {/* Spacer */}
      </div>

      {/* Reader Images */}
      <div className="flex flex-col items-center max-w-3xl mx-auto pb-20">
        {images.map((imgUrl, idx) => (
          // PERBAIKAN: Wajib lewat Proxy, loading lazy, no-referrer
          <img
            key={idx}
            src={`/api/komik/image?url=${encodeURIComponent(imgUrl)}`}
            alt={`Page ${idx + 1}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-auto min-h-[300px] object-cover bg-gray-900"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder-error.jpg"; // Fallback image internal
            }}
          />
        ))}
      </div>
    </div>
  );
}
