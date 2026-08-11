"use client";

import React, { useState, useEffect } from "react";

// ==========================================
// 1. KOMPONEN IKLAN (AD BANNER)
// ==========================================
const Advertisement = ({ position }) => {
  useEffect(() => {
    try {
      if (window && typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.warn("Gagal memuat iklan di posisi:", position, error);
    }
  }, [position]);

  return (
    <div 
      className="w-full my-4 flex items-center justify-center bg-gray-100 rounded-lg border border-dashed border-gray-300"
      style={{ minHeight: "90px", overflow: "hidden" }}
    >
      <p className="text-xs text-gray-400 font-mono">
        [ Ruang Iklan: {position} ]
      </p>
    </div>
  );
};

// ==========================================
// 2. MAIN COMPONENT: BACA KOMIK
// ==========================================
export default function BacaKomik() {
  const TARGET_WEB = "https://fullmanhwa.com";
  
  const [loading, setLoading] = useState(true);
  const [dataKomik, setDataKomik] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchKomikData = async () => {
      setLoading(true);
      setErrorMsg("");
      
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        setDataKomik({
          source: TARGET_WEB,
          status: "Berhasil terkoneksi ke server pusat.",
          // Contoh simulasi daftar URL gambar (ganti dengan hasil API scrapingmu)
          gambar: [
            "https://contoh.fullmanhwa.com/image1.jpg",
            "https://contoh.fullmanhwa.com/image2.jpg"
          ]
        });
      } catch (error) {
        console.error("Terjadi kesalahan sistem:", error);
        setErrorMsg("Gagal memuat komik dari server pusat. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchKomikData();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white min-h-screen">
      <header className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Baca Komik Online</h1>
        <p className="text-sm text-gray-500">
          Sumber rujukan: <a href={TARGET_WEB} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{TARGET_WEB}</a>
        </p>
      </header>

      <Advertisement position="Top Header" />

      <main className="my-6">
        {loading && (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded w-full mt-4"></div>
          </div>
        )}

        {!loading && errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700 font-medium">⚠️ {errorMsg}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 text-sm bg-red-100 px-3 py-1 rounded hover:bg-red-200 transition"
            >
              Muat Ulang
            </button>
          </div>
        )}

        {!loading && !errorMsg && dataKomik && (
          <div className="content-wrapper bg-gray-50 p-4 rounded-lg shadow-inner">
            <p className="text-center text-gray-600 mb-4">{dataKomik.status}</p>
            
            <div className="flex flex-col items-center w-full space-y-1">
              {dataKomik.gambar.map((urlAsli, index) => (
                <img 
                  key={index}
                  src={`/api/proxy-gambar?url=${encodeURIComponent(urlAsli)}`}
                  alt={`Halaman ${index + 1}`}
                  className="w-full h-auto object-cover max-w-2xl"
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <Advertisement position="Bottom Footer" />
      
    </div>
  );
}
