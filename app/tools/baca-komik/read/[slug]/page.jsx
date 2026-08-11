"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ReadComic() {
  const params = useParams();
  const router = useRouter();
  
  // Mengambil parameter dari URL (contoh: fm%3...)
  const slug = params?.slug || "";

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchChapterImages = async () => {
      setLoading(true);
      setError("");
      
      try {
        // ==========================================
        // ⚠️ PENTING: TEMPATKAN LOGIKA FETCHING KAMU DI SINI
        // Jika kamu mengambil data dari API scraper yang kamu buat,
        // gunakan kode fetch milikmu di sini.
        // const response = await fetch(`/api/scrape-chapter?id=${slug}`);
        // const data = await response.json();
        // setImages(data.images); // Pastikan formatnya array url gambar
        // ==========================================

        // SIMULASI SEMENTARA AGAR WEB TIDAK CRASH
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Contoh array URL gambar (Ganti dengan data hasil scraping kamu)
        setImages([
          "https://contoh-server.fullmanhwa.com/gambar1.jpg",
          "https://contoh-server.fullmanhwa.com/gambar2.jpg"
        ]);
        
      } catch (err) {
        console.error("Gagal memuat chapter:", err);
        setError("Gagal memuat gambar komik dari server pusat.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchChapterImages();
  }, [slug]);

  return (
    <div className="bg-black min-h-screen text-white pb-10">
      {/* Top Navigation (Sesuai dengan screenshot kamu) */}
      <div className="flex justify-between items-center p-4 sticky top-0 bg-black/90 backdrop-blur z-10 border-b border-gray-800">
        <button 
          onClick={() => router.back()} 
          className="text-gray-500 hover:text-white font-medium"
        >
          Prev
        </button>
        <button 
          className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-semibold shadow-lg shadow-purple-900/50"
        >
          Next &gt;
        </button>
      </div>

      {/* Area Render Gambar Komik */}
      <div className="flex flex-col items-center w-full max-w-3xl mx-auto min-h-screen justify-center mt-4">
        {loading && (
          <div className="flex flex-col items-center text-gray-400 space-y-4">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="animate-pulse">Memuat chapter...</p>
          </div>
        )}
        
        {error && (
          <div className="text-red-500 text-center bg-red-950/30 p-6 rounded-lg border border-red-900">
            <p>⚠️ {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-white"
            >
              Muat Ulang
            </button>
          </div>
        )}

        {/* 
          ==========================================
          BAGIAN BYPASS GAMBAR MENGGUNAKAN API PROXY
          ==========================================
        */}
        {!loading && images.length > 0 && images.map((url, idx) => (
          <img 
            key={idx}
            // MENGGUNAKAN API PROXY YANG KITA BUAT TADI AGAR TIDAK BLANK
            src={`/api/proxy-gambar?url=${encodeURIComponent(url)}`}
            alt={`Page ${idx + 1}`}
            className="w-full h-auto object-contain"
            loading={idx === 0 ? "eager" : "lazy"} // Gambar pertama langsung dimuat, sisanya tunggu di-scroll
            onError={(e) => {
              // Jika gambar benar-benar rusak/tidak ada, sembunyikan kotak errornya
              e.target.style.display = 'none'; 
            }}
          />
        ))}
      </div>
      
      {/* Bottom Navigation */}
      {!loading && images.length > 0 && (
        <div className="flex justify-between items-center p-4 mt-8 max-w-3xl mx-auto border-t border-gray-800">
          <button 
            onClick={() => router.back()} 
            className="text-gray-500 hover:text-white font-medium"
          >
            Prev
          </button>
          <button 
            className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-semibold"
          >
            Next &gt;
          </button>
        </div>
      )}
    </div>
  );
}
