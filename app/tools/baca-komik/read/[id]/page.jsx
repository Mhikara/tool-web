"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// KOMPONEN PINTAR (Tanpa API Lokal)
const ComicImage = ({ url, idx }) => {
  const [srcIndex, setSrcIndex] = useState(0);
  const encoded = encodeURIComponent(url);

  // DAFTAR PROXY GLOBAL (Melewati API Lokal agar terminal tidak spam error)
  const sources = [
    // Jalur 1: DuckDuckGo Image Cache (Sangat ampuh menembus blokir web komik)
    `https://external-content.duckduckgo.com/iu/?u=${encoded}`,
    // Jalur 2: Weserv CDN
    `https://wsrv.nl/?url=${encoded}`,
    // Jalur 3: WordPress Photon
    `https://i0.wp.com/${url.replace(/^https?:\/\//, '')}`,
    // Jalur 4: Langsung dari URL asli dengan no-referrer
    url
  ];

  return (
    <img
      src={sources[srcIndex]}
      referrerPolicy="no-referrer"
      alt={`Page ${idx + 1}`}
      className="w-full h-auto object-contain"
      loading={idx === 0 ? "eager" : "lazy"}
      onError={() => {
        // Jika DuckDuckGo gagal, otomatis pindah ke jalur berikutnya tanpa layar hitam lama
        if (srcIndex < sources.length - 1) {
          setSrcIndex(srcIndex + 1);
        }
      }}
    />
  );
};

export default function ReadComic() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id || "";

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchChapterImages = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/komik?action=read&chapterId=${id}`);
        if (!response.ok) throw new Error("Gagal mengambil data chapter");
        
        const data = await response.json();
        
        let imageList = [];
        if (Array.isArray(data)) imageList = data;
        else if (data.data && Array.isArray(data.data)) imageList = data.data;
        else if (data.images && Array.isArray(data.images)) imageList = data.images;

        if (imageList.length === 0) throw new Error("Daftar gambar chapter kosong.");
        setImages(imageList);
      } catch (err) {
        console.error("Error:", err);
        setError("Gagal memuat daftar gambar komik.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchChapterImages();
  }, [id]);

  return (
    <div className="bg-black min-h-screen text-white pb-10">
      <div className="flex justify-between items-center p-4 sticky top-0 bg-black/90 backdrop-blur z-10 border-b border-gray-800">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-white font-medium">Prev</button>
        <button className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-semibold shadow-lg shadow-purple-900/50">Next &gt;</button>
      </div>

      <div className="flex flex-col items-center w-full max-w-3xl mx-auto min-h-screen mt-4 space-y-1">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-4">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="animate-pulse">Memuat chapter...</p>
          </div>
        )}
        
        {error && (
          <div className="text-red-500 text-center bg-red-950/30 p-6 rounded-lg border border-red-900 mt-10">
            <p>⚠️ {error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-white">Muat Ulang</button>
          </div>
        )}

        {!loading && images.length > 0 && images.map((url, idx) => (
          <ComicImage key={idx} url={url} idx={idx} />
        ))}
      </div>
      
      {!loading && images.length > 0 && (
        <div className="flex justify-between items-center p-4 mt-8 max-w-3xl mx-auto border-t border-gray-800">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-white font-medium">Prev</button>
          <button className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-semibold">Next &gt;</button>
        </div>
      )}
    </div>
  );
}
