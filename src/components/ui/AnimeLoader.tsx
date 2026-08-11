"use client";

export default function AnimeLoader({ label = "Memuat..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-pink-400/20" />
        <div className="absolute inset-0 rounded-full border-4 border-t-pink-400 border-r-transparent border-b-transparent border-l-transparent animate-spin-slow" />
        <div className="absolute inset-1.5 rounded-full border-4 border-t-transparent border-r-cyan-400 border-b-transparent border-l-transparent animate-spin-reverse" />
      </div>
      <p className="mt-3 text-xs tracking-widest text-gray-500 uppercase animate-pulse">
        {label}
      </p>

      <style>{`
        .animate-spin-slow { animation: spin 1.6s linear infinite; }
        .animate-spin-reverse { animation: spin 1.1s linear infinite reverse; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
