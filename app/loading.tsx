export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col items-center justify-center overflow-hidden">
      {/* Kelopak jatuh */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="petal"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Ring energi berputar */}
      <div className="relative w-28 h-28">
        <div className="absolute inset-0 rounded-full border-4 border-pink-400/20" />
        <div className="absolute inset-0 rounded-full border-4 border-t-pink-400 border-r-transparent border-b-transparent border-l-transparent animate-spin-slow" />
        <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-cyan-400 border-b-transparent border-l-transparent animate-spin-reverse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">⚔️</span>
        </div>
      </div>

      <p className="mt-6 text-sm tracking-[0.3em] text-pink-200 uppercase animate-pulse">
        Memuat
      </p>
      <p className="mt-1 text-xs text-slate-400">Menyiapkan dunia...</p>

      <style>{`
        .petal {
          position: absolute;
          top: -10px;
          width: 8px;
          height: 8px;
          background: linear-gradient(135deg, #f9a8d4, #f472b6);
          border-radius: 100% 0 100% 0;
          animation: fall linear infinite;
          opacity: 0.8;
        }
        @keyframes fall {
          0% {
            transform: translateY(-10px) translateX(0) rotate(0deg);
            opacity: 0.9;
          }
          100% {
            transform: translateY(110vh) translateX(40px) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-spin-slow {
          animation: spin 1.6s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin 1.1s linear infinite reverse;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
