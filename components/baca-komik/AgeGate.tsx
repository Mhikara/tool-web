"use client";
import { useEffect, useState } from "react";
import { getAgeOk, setAgeOk, getNsfw, setNsfw } from "@/lib/komik/comicPrefs";

export default function AgeGate() {
  const [show, setShow] = useState(false);
  const [nsfw, setNsfwState] = useState(false);
  useEffect(() => {
    setShow(!getAgeOk());
    setNsfwState(getNsfw());
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-zinc-900 p-6 ring-1 ring-white/10">
        <h2 className="text-lg font-bold text-white">Konfirmasi usia</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Konten mungkin tidak sesuai semua umur. Apakah Anda 18+?
        </p>
        <label className="mt-4 flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={nsfw} onChange={(e) => setNsfwState(e.target.checked)} />
          Mode NSFW
        </label>
        <div className="mt-5 flex gap-2">
          <button type="button" className="flex-1 rounded-xl bg-zinc-800 py-2.5 text-sm font-semibold"
            onClick={() => { setAgeOk(false); setNsfw(false); window.location.href = "/"; }}>
            Keluar
          </button>
          <button type="button" className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white"
            onClick={() => { setAgeOk(true); setNsfw(nsfw); setShow(false); }}>
            Saya 18+
          </button>
        </div>
      </div>
    </div>
  );
}
